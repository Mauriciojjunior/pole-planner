-- Fix security warnings: set search_path for functions

-- Fix emit_event function
CREATE OR REPLACE FUNCTION public.emit_event(
  p_tenant_id UUID,
  p_event_type public.event_type,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_payload JSONB DEFAULT '{}',
  p_actor_id UUID DEFAULT NULL,
  p_actor_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_webhook RECORD;
BEGIN
  -- Insert the event
  INSERT INTO public.events (
    tenant_id, event_type, entity_type, entity_id, 
    payload, actor_id, actor_type
  ) VALUES (
    p_tenant_id, p_event_type, p_entity_type, p_entity_id,
    p_payload, p_actor_id, p_actor_type
  ) RETURNING id INTO v_event_id;

  -- Create notification job
  INSERT INTO public.jobs (tenant_id, type, payload, priority)
  VALUES (
    p_tenant_id,
    'send_notifications',
    jsonb_build_object(
      'event_id', v_event_id,
      'event_type', p_event_type::TEXT,
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'payload', p_payload
    ),
    CASE 
      WHEN p_event_type IN ('booking.reminder', 'class.reminder') THEN 10
      ELSE 5
    END
  );

  -- Create webhook delivery jobs for matching subscriptions
  FOR v_webhook IN 
    SELECT id, url, secret, headers
    FROM public.webhook_subscriptions
    WHERE tenant_id = p_tenant_id
      AND is_active = true
      AND p_event_type::TEXT = ANY(events)
  LOOP
    INSERT INTO public.webhook_deliveries (
      webhook_subscription_id, event_id, status
    ) VALUES (
      v_webhook.id, v_event_id, 'pending'
    );
    
    INSERT INTO public.jobs (tenant_id, type, payload, priority)
    VALUES (
      p_tenant_id,
      'deliver_webhook',
      jsonb_build_object(
        'event_id', v_event_id,
        'webhook_subscription_id', v_webhook.id,
        'url', v_webhook.url,
        'secret', v_webhook.secret,
        'headers', v_webhook.headers
      ),
      3
    );
  END LOOP;

  RETURN v_event_id;
END;
$$;

-- Fix schedule_reminders function
CREATE OR REPLACE FUNCTION public.schedule_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_booking RECORD;
  v_class RECORD;
BEGIN
  -- Schedule booking reminders (24h before class)
  FOR v_booking IN 
    SELECT 
      b.id as booking_id,
      b.tenant_id,
      b.student_id,
      c.starts_at,
      ct.name as class_name
    FROM public.bookings b
    JOIN public.classes c ON c.id = b.class_id
    JOIN public.class_types ct ON ct.id = c.class_type_id
    WHERE b.status = 'confirmed'
      AND c.starts_at BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.jobs 
        WHERE type = 'send_notifications'
          AND payload->>'booking_id' = b.id::TEXT
          AND payload->>'reminder_type' = '24h'
      )
  LOOP
    INSERT INTO public.jobs (tenant_id, type, payload, priority, scheduled_at)
    VALUES (
      v_booking.tenant_id,
      'send_notifications',
      jsonb_build_object(
        'event_type', 'booking.reminder',
        'booking_id', v_booking.booking_id,
        'student_id', v_booking.student_id,
        'class_name', v_booking.class_name,
        'starts_at', v_booking.starts_at,
        'reminder_type', '24h'
      ),
      10,
      v_booking.starts_at - interval '24 hours'
    );
    v_count := v_count + 1;
  END LOOP;

  -- Schedule subscription expiring reminders (7 days before)
  INSERT INTO public.jobs (tenant_id, type, payload, priority)
  SELECT 
    s.tenant_id,
    'send_notifications',
    jsonb_build_object(
      'event_type', 'subscription.expiring',
      'subscription_id', s.id,
      'student_id', s.student_id,
      'plan_name', p.name,
      'ends_at', s.ends_at
    ),
    5
  FROM public.subscriptions s
  JOIN public.plans p ON p.id = s.plan_id
  WHERE s.status = 'active'
    AND s.ends_at BETWEEN now() + interval '6 days' AND now() + interval '8 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.jobs 
      WHERE type = 'send_notifications'
        AND payload->>'subscription_id' = s.id::TEXT
        AND payload->>'event_type' = 'subscription.expiring'
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

-- Fix RLS policy for events insert - only allow from authenticated or service role
DROP POLICY IF EXISTS "System can insert events" ON public.events;
CREATE POLICY "Authenticated users can insert events"
  ON public.events FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- The other "always true" warnings are from existing migrations not related to this one