-- =====================================================
-- DATA RETENTION AND LGPD COMPLIANCE
-- =====================================================

-- Data retention policies table
CREATE TABLE public.data_retention_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  deletion_strategy TEXT NOT NULL DEFAULT 'hard_delete',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Data export requests (LGPD Art. 18)
CREATE TABLE public.data_export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  format TEXT NOT NULL DEFAULT 'json',
  file_path TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_export_requests_profile ON public.data_export_requests(profile_id);
CREATE INDEX idx_data_export_requests_status ON public.data_export_requests(status) WHERE status = 'pending';

-- Account deletion requests (LGPD Art. 18)
CREATE TABLE public.account_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  error TEXT
);

CREATE INDEX idx_account_deletion_requests_profile ON public.account_deletion_requests(profile_id);
CREATE INDEX idx_account_deletion_requests_scheduled ON public.account_deletion_requests(scheduled_for) WHERE status = 'scheduled';

-- Metrics table for observability
CREATE TABLE public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  labels JSONB DEFAULT '{}',
  tenant_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partition-ready index for time-series queries
CREATE INDEX idx_metrics_name_time ON public.metrics(name, recorded_at DESC);
CREATE INDEX idx_metrics_tenant_time ON public.metrics(tenant_id, recorded_at DESC) WHERE tenant_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Only admins can manage retention policies"
  ON public.data_retention_policies FOR ALL
  USING (is_platform_admin(get_current_profile_id()));

CREATE POLICY "Users can view their own export requests"
  ON public.data_export_requests FOR SELECT
  USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can create export requests"
  ON public.data_export_requests FOR INSERT
  WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Users can view their own deletion requests"
  ON public.account_deletion_requests FOR SELECT
  USING (profile_id = get_current_profile_id());

CREATE POLICY "Users can create deletion requests"
  ON public.account_deletion_requests FOR INSERT
  WITH CHECK (profile_id = get_current_profile_id());

CREATE POLICY "Users can cancel their own pending deletion requests"
  ON public.account_deletion_requests FOR UPDATE
  USING (profile_id = get_current_profile_id() AND status = 'pending');

CREATE POLICY "System can insert metrics"
  ON public.metrics FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Admins and teachers can view metrics"
  ON public.metrics FOR SELECT
  USING (
    is_platform_admin(get_current_profile_id()) 
    OR tenant_id = get_current_tenant_id()
  );

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, deletion_strategy)
VALUES 
  ('audit_logs', 365, 'archive'),
  ('events', 90, 'hard_delete'),
  ('jobs', 30, 'hard_delete'),
  ('webhook_deliveries', 30, 'hard_delete'),
  ('notifications', 90, 'hard_delete'),
  ('metrics', 90, 'hard_delete');

-- Function to export user data (LGPD compliance)
CREATE OR REPLACE FUNCTION public.export_user_data(p_profile_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_profile RECORD;
  v_teacher RECORD;
  v_student RECORD;
BEGIN
  -- Get profile data
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_profile_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  v_result := jsonb_build_object(
    'export_date', now(),
    'profile', jsonb_build_object(
      'id', v_profile.id,
      'email', v_profile.email,
      'name', v_profile.name,
      'avatar_url', v_profile.avatar_url,
      'created_at', v_profile.created_at
    )
  );

  -- Get teacher data if exists
  SELECT t.* INTO v_teacher 
  FROM public.teachers t
  JOIN public.user_roles ur ON ur.tenant_id = t.id
  WHERE ur.profile_id = p_profile_id AND ur.role = 'teacher';

  IF v_teacher IS NOT NULL THEN
    v_result := v_result || jsonb_build_object(
      'teacher', jsonb_build_object(
        'name', v_teacher.name,
        'email', v_teacher.email,
        'phone', v_teacher.phone,
        'bio', v_teacher.bio,
        'specialties', v_teacher.specialties,
        'created_at', v_teacher.created_at
      ),
      'classes', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', c.id,
          'starts_at', c.starts_at,
          'ends_at', c.ends_at,
          'class_type', ct.name
        )), '[]'::jsonb)
        FROM public.classes c
        JOIN public.class_types ct ON ct.id = c.class_type_id
        WHERE c.tenant_id = v_teacher.id
      ),
      'students', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'name', s.name,
          'email', s.email,
          'created_at', s.created_at
        )), '[]'::jsonb)
        FROM public.students s
        WHERE s.tenant_id = v_teacher.id
      )
    );
  END IF;

  -- Get student data if exists
  SELECT s.* INTO v_student 
  FROM public.students s
  WHERE s.profile_id = p_profile_id;

  IF v_student IS NOT NULL THEN
    v_result := v_result || jsonb_build_object(
      'student', jsonb_build_object(
        'name', v_student.name,
        'email', v_student.email,
        'phone', v_student.phone,
        'created_at', v_student.created_at
      ),
      'bookings', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', b.id,
          'status', b.status,
          'booked_at', b.booked_at,
          'class_date', c.starts_at
        )), '[]'::jsonb)
        FROM public.bookings b
        JOIN public.classes c ON c.id = b.class_id
        WHERE b.student_id = v_student.id
      ),
      'subscriptions', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', sub.id,
          'plan_name', p.name,
          'status', sub.status,
          'starts_at', sub.starts_at,
          'ends_at', sub.ends_at
        )), '[]'::jsonb)
        FROM public.subscriptions sub
        JOIN public.plans p ON p.id = sub.plan_id
        WHERE sub.student_id = v_student.id
      )
    );
  END IF;

  -- Get notifications
  v_result := v_result || jsonb_build_object(
    'notifications', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', n.title,
        'body', n.body,
        'type', n.type,
        'created_at', n.created_at
      )), '[]'::jsonb)
      FROM public.notifications n
      WHERE n.profile_id = p_profile_id
    )
  );

  RETURN v_result;
END;
$$;

-- Function to request account deletion
CREATE OR REPLACE FUNCTION public.request_account_deletion(
  p_profile_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  -- Check for existing pending request
  IF EXISTS (
    SELECT 1 FROM public.account_deletion_requests 
    WHERE profile_id = p_profile_id AND status IN ('pending', 'scheduled')
  ) THEN
    RAISE EXCEPTION 'Deletion request already exists';
  END IF;

  -- Create deletion request (30-day grace period)
  INSERT INTO public.account_deletion_requests (
    profile_id, reason, status, scheduled_for
  ) VALUES (
    p_profile_id, p_reason, 'scheduled', now() + interval '30 days'
  ) RETURNING id INTO v_request_id;

  -- Log the action
  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_id, actor_type, new_values
  ) VALUES (
    'account_deletion_request', v_request_id, 'create', 
    p_profile_id, 'user',
    jsonb_build_object('scheduled_for', now() + interval '30 days')
  );

  RETURN v_request_id;
END;
$$;

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion(
  p_profile_id UUID,
  p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_deletion_requests
  SET status = 'cancelled', cancelled_at = now()
  WHERE id = p_request_id 
    AND profile_id = p_profile_id 
    AND status IN ('pending', 'scheduled');

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_id, actor_type
  ) VALUES (
    'account_deletion_request', p_request_id, 'cancel', 
    p_profile_id, 'user'
  );

  RETURN true;
END;
$$;

-- Function to apply data retention
CREATE OR REPLACE FUNCTION public.apply_data_retention()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy RECORD;
  v_deleted INTEGER := 0;
  v_count INTEGER;
BEGIN
  FOR v_policy IN 
    SELECT * FROM public.data_retention_policies 
    WHERE is_active = true
  LOOP
    BEGIN
      -- Different handling based on table
      CASE v_policy.table_name
        WHEN 'jobs' THEN
          DELETE FROM public.jobs 
          WHERE status IN ('completed', 'dead') 
            AND created_at < now() - (v_policy.retention_days || ' days')::interval;
          GET DIAGNOSTICS v_count = ROW_COUNT;
          
        WHEN 'events' THEN
          DELETE FROM public.events 
          WHERE created_at < now() - (v_policy.retention_days || ' days')::interval;
          GET DIAGNOSTICS v_count = ROW_COUNT;
          
        WHEN 'webhook_deliveries' THEN
          DELETE FROM public.webhook_deliveries 
          WHERE created_at < now() - (v_policy.retention_days || ' days')::interval;
          GET DIAGNOSTICS v_count = ROW_COUNT;
          
        WHEN 'metrics' THEN
          DELETE FROM public.metrics 
          WHERE recorded_at < now() - (v_policy.retention_days || ' days')::interval;
          GET DIAGNOSTICS v_count = ROW_COUNT;
          
        WHEN 'notifications' THEN
          DELETE FROM public.notifications 
          WHERE is_read = true 
            AND created_at < now() - (v_policy.retention_days || ' days')::interval;
          GET DIAGNOSTICS v_count = ROW_COUNT;
          
        ELSE
          v_count := 0;
      END CASE;

      v_deleted := v_deleted + v_count;

      -- Update last run time
      UPDATE public.data_retention_policies
      SET last_run_at = now(), 
          next_run_at = now() + interval '1 day'
      WHERE id = v_policy.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Retention policy for % failed: %', v_policy.table_name, SQLERRM;
    END;
  END LOOP;

  RETURN v_deleted;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.export_user_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_data_retention TO service_role;