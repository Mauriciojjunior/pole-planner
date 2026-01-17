-- =====================================================
-- EVENT AND NOTIFICATION SYSTEM
-- =====================================================

-- Create event types enum
CREATE TYPE public.event_type AS ENUM (
  'booking.created',
  'booking.approved',
  'booking.rejected',
  'booking.cancelled',
  'booking.reminder',
  'class.reminder',
  'class.cancelled',
  'subscription.created',
  'subscription.expiring',
  'subscription.expired',
  'subscription.renewed',
  'teacher.approved',
  'teacher.rejected',
  'teacher.blocked',
  'teacher.unblocked',
  'admin.action'
);

-- Create notification channel enum
CREATE TYPE public.notification_channel AS ENUM (
  'email',
  'whatsapp',
  'in_app',
  'webhook'
);

-- Events table - stores all system events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_id UUID,
  actor_type TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying events
CREATE INDEX idx_events_tenant_id ON public.events(tenant_id);
CREATE INDEX idx_events_event_type ON public.events(event_type);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id);

-- Webhook subscriptions table
CREATE TABLE public.webhook_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_subscriptions_tenant ON public.webhook_subscriptions(tenant_id);
CREATE INDEX idx_webhook_subscriptions_active ON public.webhook_subscriptions(is_active) WHERE is_active = true;

-- Webhook deliveries table - tracks webhook delivery attempts
CREATE TABLE public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries(status) WHERE status IN ('pending', 'retrying');
CREATE INDEX idx_webhook_deliveries_next_retry ON public.webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  channel public.notification_channel NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, event_type, channel)
);

-- Notification preferences per user
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, tenant_id, channel)
);

CREATE INDEX idx_notification_preferences_profile ON public.notification_preferences(profile_id);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Teachers can view their tenant events"
  ON public.events FOR SELECT
  USING (tenant_id = get_current_tenant_id() OR is_platform_admin(get_current_profile_id()));

CREATE POLICY "System can insert events"
  ON public.events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for webhook_subscriptions
CREATE POLICY "Teachers can manage their webhooks"
  ON public.webhook_subscriptions FOR ALL
  USING (tenant_id = get_current_tenant_id());

-- RLS Policies for webhook_deliveries
CREATE POLICY "Teachers can view their webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (
    webhook_subscription_id IN (
      SELECT id FROM public.webhook_subscriptions 
      WHERE tenant_id = get_current_tenant_id()
    )
  );

-- RLS Policies for notification_templates
CREATE POLICY "Teachers can manage their templates"
  ON public.notification_templates FOR ALL
  USING (tenant_id = get_current_tenant_id() OR tenant_id IS NULL);

CREATE POLICY "Admins can manage system templates"
  ON public.notification_templates FOR ALL
  USING (is_platform_admin(get_current_profile_id()));

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their preferences"
  ON public.notification_preferences FOR ALL
  USING (profile_id = get_current_profile_id());

-- Function to emit an event and create notification jobs
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

-- Function to schedule reminders
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

-- Insert default notification templates
INSERT INTO public.notification_templates (tenant_id, event_type, channel, name, subject, body_template, is_system)
VALUES 
  -- Booking templates
  (NULL, 'booking.created', 'email', 'Booking Created', 
   'Nova reserva recebida', 
   'Olá {{teacher_name}},\n\nVocê recebeu uma nova reserva de {{student_name}} para {{class_name}} em {{class_date}}.\n\nAcesse o sistema para aprovar ou rejeitar.',
   true),
  (NULL, 'booking.approved', 'email', 'Booking Approved',
   'Sua reserva foi confirmada!',
   'Olá {{student_name}},\n\nSua reserva para {{class_name}} em {{class_date}} foi confirmada!\n\nNos vemos em breve.',
   true),
  (NULL, 'booking.rejected', 'email', 'Booking Rejected',
   'Reserva não confirmada',
   'Olá {{student_name}},\n\nInfelizmente sua reserva para {{class_name}} em {{class_date}} não pôde ser confirmada.\n\nMotivo: {{reason}}\n\nPor favor, escolha outro horário.',
   true),
  (NULL, 'booking.reminder', 'email', 'Booking Reminder',
   'Lembrete: Sua aula é amanhã!',
   'Olá {{student_name}},\n\nLembrando que você tem aula de {{class_name}} amanhã às {{class_time}}.\n\nNos vemos lá!',
   true),
  -- Subscription templates
  (NULL, 'subscription.expiring', 'email', 'Subscription Expiring',
   'Seu plano está expirando',
   'Olá {{student_name}},\n\nSeu plano {{plan_name}} expira em {{days_remaining}} dias.\n\nRenove agora para continuar aproveitando as aulas!',
   true),
  (NULL, 'subscription.expired', 'email', 'Subscription Expired',
   'Seu plano expirou',
   'Olá {{student_name}},\n\nSeu plano {{plan_name}} expirou.\n\nRenove agora para continuar aproveitando as aulas!',
   true),
  -- Teacher templates
  (NULL, 'teacher.approved', 'email', 'Teacher Approved',
   'Seu cadastro foi aprovado!',
   'Parabéns {{teacher_name}}!\n\nSeu cadastro foi aprovado e você já pode começar a usar a plataforma.\n\nAcesse agora e configure sua agenda.',
   true),
  (NULL, 'teacher.rejected', 'email', 'Teacher Rejected',
   'Cadastro não aprovado',
   'Olá {{teacher_name}},\n\nInfelizmente seu cadastro não foi aprovado.\n\nMotivo: {{reason}}\n\nEntre em contato conosco para mais informações.',
   true);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.emit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.schedule_reminders TO authenticated;