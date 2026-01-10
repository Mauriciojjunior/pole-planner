-- Add plan_type enum for billing periods
CREATE TYPE plan_type AS ENUM ('monthly', 'quarterly', 'semiannual', 'custom');

-- Add fields to plans table for enhanced plan management
ALTER TABLE public.plans 
ADD COLUMN plan_type plan_type DEFAULT 'monthly',
ADD COLUMN trial_days integer DEFAULT 0,
ADD COLUMN features jsonb DEFAULT '[]'::jsonb,
ADD COLUMN stripe_price_id varchar(255),
ADD COLUMN stripe_product_id varchar(255),
ADD COLUMN sort_order integer DEFAULT 0;

-- Add trial and Stripe fields to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN trial_ends_at date,
ADD COLUMN is_trial boolean DEFAULT false,
ADD COLUMN payment_method varchar(50) DEFAULT 'manual',
ADD COLUMN stripe_subscription_id varchar(255),
ADD COLUMN stripe_customer_id varchar(255),
ADD COLUMN next_billing_date date,
ADD COLUMN cancellation_reason text,
ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

-- Add WhatsApp contact to teachers for sales redirect
ALTER TABLE public.teachers
ADD COLUMN whatsapp_number varchar(20),
ADD COLUMN sales_message_template text DEFAULT 'Olá! Gostaria de contratar o plano {{plan_name}}.';

-- Create index for subscription queries
CREATE INDEX idx_subscriptions_status_ends ON public.subscriptions(status, ends_at);
CREATE INDEX idx_subscriptions_trial ON public.subscriptions(is_trial, trial_ends_at) WHERE is_trial = true;
CREATE INDEX idx_plans_active_type ON public.plans(is_active, plan_type);

-- Function to check if student has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  p_student_id uuid,
  p_tenant_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE student_id = p_student_id
      AND tenant_id = p_tenant_id
      AND status = 'active'
      AND (ends_at >= CURRENT_DATE OR (is_trial = true AND trial_ends_at >= CURRENT_DATE))
  );
END;
$$;

-- Function to get subscription details with remaining classes
CREATE OR REPLACE FUNCTION public.get_student_subscription(
  p_student_id uuid,
  p_tenant_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
  v_plan record;
  v_result jsonb;
BEGIN
  SELECT s.*, p.name as plan_name, p.features, p.classes_per_month
  INTO v_subscription
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.student_id = p_student_id
    AND s.tenant_id = p_tenant_id
    AND s.status IN ('active', 'paused')
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('has_subscription', false);
  END IF;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'subscription_id', v_subscription.id,
    'plan_name', v_subscription.plan_name,
    'status', v_subscription.status,
    'is_trial', v_subscription.is_trial,
    'trial_ends_at', v_subscription.trial_ends_at,
    'starts_at', v_subscription.starts_at,
    'ends_at', v_subscription.ends_at,
    'classes_remaining', v_subscription.classes_remaining,
    'classes_per_month', v_subscription.classes_per_month,
    'features', v_subscription.features,
    'auto_renew', v_subscription.auto_renew
  );
END;
$$;

-- Function to create subscription (with optional trial)
CREATE OR REPLACE FUNCTION public.create_subscription(
  p_student_id uuid,
  p_plan_id uuid,
  p_tenant_id uuid,
  p_start_trial boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan record;
  v_existing_active int;
  v_subscription_id uuid;
  v_starts_at date;
  v_ends_at date;
  v_trial_ends_at date;
  v_is_trial boolean;
BEGIN
  -- Validate plan exists and is active
  SELECT * INTO v_plan FROM plans 
  WHERE id = p_plan_id AND tenant_id = p_tenant_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PLAN_NOT_FOUND');
  END IF;

  -- Check for existing active subscription
  SELECT COUNT(*) INTO v_existing_active
  FROM subscriptions
  WHERE student_id = p_student_id
    AND tenant_id = p_tenant_id
    AND status = 'active';

  IF v_existing_active > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_SUBSCRIBED');
  END IF;

  -- Calculate dates
  v_starts_at := CURRENT_DATE;
  v_is_trial := p_start_trial AND v_plan.trial_days > 0;

  IF v_is_trial THEN
    v_trial_ends_at := CURRENT_DATE + v_plan.trial_days;
    v_ends_at := v_trial_ends_at + v_plan.duration_days;
  ELSE
    v_trial_ends_at := NULL;
    v_ends_at := CURRENT_DATE + v_plan.duration_days;
  END IF;

  -- Create subscription
  INSERT INTO subscriptions (
    tenant_id,
    student_id,
    plan_id,
    status,
    starts_at,
    ends_at,
    is_trial,
    trial_ends_at,
    classes_remaining,
    payment_method
  ) VALUES (
    p_tenant_id,
    p_student_id,
    p_plan_id,
    'active',
    v_starts_at,
    v_ends_at,
    v_is_trial,
    v_trial_ends_at,
    v_plan.classes_per_month,
    'manual'
  ) RETURNING id INTO v_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_subscription_id,
    'is_trial', v_is_trial,
    'trial_ends_at', v_trial_ends_at,
    'ends_at', v_ends_at
  );
END;
$$;

-- Function to cancel subscription
CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_subscription_id uuid,
  p_tenant_id uuid,
  p_reason text DEFAULT NULL,
  p_immediate boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
BEGIN
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE id = p_subscription_id
    AND tenant_id = p_tenant_id
    AND status IN ('active', 'paused');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SUBSCRIPTION_NOT_FOUND');
  END IF;

  IF p_immediate THEN
    UPDATE subscriptions
    SET status = 'cancelled',
        cancelled_at = now(),
        cancellation_reason = p_reason,
        auto_renew = false
    WHERE id = p_subscription_id;
  ELSE
    -- Cancel at end of period
    UPDATE subscriptions
    SET auto_renew = false,
        cancellation_reason = p_reason
    WHERE id = p_subscription_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'cancelled_immediately', p_immediate,
    'effective_end_date', CASE WHEN p_immediate THEN CURRENT_DATE ELSE v_subscription.ends_at END
  );
END;
$$;

-- Function to renew subscription
CREATE OR REPLACE FUNCTION public.renew_subscription(
  p_subscription_id uuid,
  p_tenant_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription record;
  v_plan record;
  v_new_ends_at date;
BEGIN
  SELECT s.*, p.duration_days, p.classes_per_month
  INTO v_subscription
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.id = p_subscription_id
    AND s.tenant_id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SUBSCRIPTION_NOT_FOUND');
  END IF;

  -- Calculate new end date from current end or today (whichever is later)
  v_new_ends_at := GREATEST(v_subscription.ends_at, CURRENT_DATE) + v_subscription.duration_days;

  UPDATE subscriptions
  SET status = 'active',
      ends_at = v_new_ends_at,
      is_trial = false,
      trial_ends_at = NULL,
      classes_remaining = COALESCE(classes_remaining, 0) + v_subscription.classes_per_month,
      cancelled_at = NULL,
      cancellation_reason = NULL
  WHERE id = p_subscription_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_ends_at', v_new_ends_at,
    'classes_remaining', COALESCE(v_subscription.classes_remaining, 0) + v_subscription.classes_per_month
  );
END;
$$;

-- Function to decrement class from subscription
CREATE OR REPLACE FUNCTION public.use_subscription_class(
  p_subscription_id uuid,
  p_tenant_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining int;
BEGIN
  UPDATE subscriptions
  SET classes_remaining = classes_remaining - 1
  WHERE id = p_subscription_id
    AND tenant_id = p_tenant_id
    AND status = 'active'
    AND (classes_remaining IS NULL OR classes_remaining > 0)
  RETURNING classes_remaining INTO v_remaining;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NO_CLASSES_REMAINING');
  END IF;

  RETURN jsonb_build_object('success', true, 'classes_remaining', v_remaining);
END;
$$;

-- Function to generate WhatsApp sales link
CREATE OR REPLACE FUNCTION public.get_whatsapp_sales_link(
  p_tenant_id uuid,
  p_plan_id uuid,
  p_student_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher record;
  v_plan record;
  v_message text;
  v_phone text;
BEGIN
  SELECT * INTO v_teacher FROM teachers WHERE id = p_tenant_id;
  SELECT * INTO v_plan FROM plans WHERE id = p_plan_id AND tenant_id = p_tenant_id;

  IF v_teacher.whatsapp_number IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'WHATSAPP_NOT_CONFIGURED');
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PLAN_NOT_FOUND');
  END IF;

  -- Build message from template
  v_message := COALESCE(v_teacher.sales_message_template, 'Olá! Gostaria de contratar o plano {{plan_name}}.');
  v_message := REPLACE(v_message, '{{plan_name}}', v_plan.name);
  v_message := REPLACE(v_message, '{{student_name}}', COALESCE(p_student_name, ''));
  v_message := REPLACE(v_message, '{{plan_price}}', (v_plan.price_cents / 100.0)::text);

  -- Clean phone number (remove non-digits)
  v_phone := REGEXP_REPLACE(v_teacher.whatsapp_number, '[^0-9]', '', 'g');

  RETURN jsonb_build_object(
    'success', true,
    'whatsapp_url', 'https://wa.me/' || v_phone || '?text=' || urlencode(v_message),
    'phone', v_phone,
    'message', v_message
  );
END;
$$;

-- Helper function for URL encoding (needed for WhatsApp links)
CREATE OR REPLACE FUNCTION public.urlencode(text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_agg(
    CASE
      WHEN ch ~ '[A-Za-z0-9_.~-]' THEN ch
      ELSE '%' || upper(encode(ch::bytea, 'hex'))
    END, ''
  )
  FROM unnest(string_to_array($1, NULL)) AS ch;
$$;

-- Comment for future Stripe integration
COMMENT ON COLUMN plans.stripe_price_id IS 'Stripe Price ID for automated billing - populate when enabling Stripe';
COMMENT ON COLUMN plans.stripe_product_id IS 'Stripe Product ID - populate when enabling Stripe';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe Subscription ID - set by webhook after payment';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe Customer ID - created on first purchase';
COMMENT ON COLUMN subscriptions.payment_method IS 'manual = WhatsApp/PIX, stripe = Stripe automated billing';