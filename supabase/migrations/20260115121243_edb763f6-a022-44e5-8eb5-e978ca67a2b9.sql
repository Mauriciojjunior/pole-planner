-- ===========================================
-- DASHBOARD AGGREGATION FUNCTIONS
-- ===========================================

-- 1. Teacher Dashboard: Classes per period (day/week/month)
CREATE OR REPLACE FUNCTION get_teacher_classes_stats(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_group_by TEXT DEFAULT 'day' -- 'day', 'week', 'month'
)
RETURNS TABLE (
  period TEXT,
  total_classes BIGINT,
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  attendance_count BIGINT,
  max_capacity BIGINT,
  occupancy_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH class_data AS (
    SELECT 
      c.id AS class_id,
      c.starts_at,
      c.max_students,
      CASE 
        WHEN p_group_by = 'day' THEN TO_CHAR(c.starts_at::date, 'YYYY-MM-DD')
        WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', c.starts_at::date), 'YYYY-"W"IW')
        WHEN p_group_by = 'month' THEN TO_CHAR(c.starts_at::date, 'YYYY-MM')
        ELSE TO_CHAR(c.starts_at::date, 'YYYY-MM-DD')
      END AS period
    FROM classes c
    WHERE c.tenant_id = p_tenant_id
      AND c.starts_at::date >= p_start_date
      AND c.starts_at::date <= p_end_date
      AND c.is_cancelled = false
  ),
  booking_data AS (
    SELECT 
      cd.period,
      COUNT(b.id) AS total_bookings,
      COUNT(b.id) FILTER (WHERE b.status = 'approved') AS confirmed_bookings,
      COUNT(b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled_bookings,
      COUNT(b.id) FILTER (WHERE b.attended = true) AS attendance_count
    FROM class_data cd
    LEFT JOIN bookings b ON b.class_id = cd.class_id AND b.tenant_id = p_tenant_id
    GROUP BY cd.period
  ),
  class_stats AS (
    SELECT 
      period,
      COUNT(*) AS total_classes,
      SUM(max_students) AS max_capacity
    FROM class_data
    GROUP BY period
  )
  SELECT 
    cs.period,
    cs.total_classes,
    COALESCE(bd.total_bookings, 0)::BIGINT,
    COALESCE(bd.confirmed_bookings, 0)::BIGINT,
    COALESCE(bd.cancelled_bookings, 0)::BIGINT,
    COALESCE(bd.attendance_count, 0)::BIGINT,
    cs.max_capacity,
    CASE 
      WHEN cs.max_capacity > 0 
      THEN ROUND((COALESCE(bd.confirmed_bookings, 0)::NUMERIC / cs.max_capacity::NUMERIC) * 100, 2)
      ELSE 0
    END AS occupancy_rate
  FROM class_stats cs
  LEFT JOIN booking_data bd ON bd.period = cs.period
  ORDER BY cs.period;
END;
$$;

-- 2. Teacher Dashboard: Classes per student
CREATE OR REPLACE FUNCTION get_teacher_student_stats(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  attended_classes BIGINT,
  missed_classes BIGINT,
  attendance_rate NUMERIC,
  last_class_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.name AS student_name,
    s.email AS student_email,
    COUNT(b.id)::BIGINT AS total_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'approved')::BIGINT AS confirmed_bookings,
    COUNT(b.id) FILTER (WHERE b.status = 'cancelled')::BIGINT AS cancelled_bookings,
    COUNT(b.id) FILTER (WHERE b.attended = true)::BIGINT AS attended_classes,
    COUNT(b.id) FILTER (WHERE b.attended = false AND b.status = 'approved' AND c.starts_at < NOW())::BIGINT AS missed_classes,
    CASE 
      WHEN COUNT(b.id) FILTER (WHERE b.status = 'approved' AND c.starts_at < NOW()) > 0
      THEN ROUND(
        (COUNT(b.id) FILTER (WHERE b.attended = true)::NUMERIC / 
         COUNT(b.id) FILTER (WHERE b.status = 'approved' AND c.starts_at < NOW())::NUMERIC) * 100, 2
      )
      ELSE 0
    END AS attendance_rate,
    MAX(c.starts_at) AS last_class_date
  FROM students s
  LEFT JOIN bookings b ON b.student_id = s.id AND b.tenant_id = p_tenant_id
  LEFT JOIN classes c ON c.id = b.class_id
  WHERE s.tenant_id = p_tenant_id
    AND s.is_active = true
    AND (p_start_date IS NULL OR c.starts_at::date >= p_start_date)
    AND (p_end_date IS NULL OR c.starts_at::date <= p_end_date)
  GROUP BY s.id, s.name, s.email
  ORDER BY total_bookings DESC
  LIMIT p_limit;
END;
$$;

-- 3. Teacher Dashboard: Summary metrics
CREATE OR REPLACE FUNCTION get_teacher_dashboard_summary(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_classes BIGINT,
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  pending_bookings BIGINT,
  cancelled_bookings BIGINT,
  total_attended BIGINT,
  total_students BIGINT,
  active_students BIGINT,
  total_capacity BIGINT,
  occupancy_rate NUMERIC,
  attendance_rate NUMERIC,
  cancellation_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH class_stats AS (
    SELECT 
      COUNT(*) AS total_classes,
      SUM(max_students) AS total_capacity
    FROM classes
    WHERE tenant_id = p_tenant_id
      AND starts_at::date >= p_start_date
      AND starts_at::date <= p_end_date
      AND is_cancelled = false
  ),
  booking_stats AS (
    SELECT 
      COUNT(*) AS total_bookings,
      COUNT(*) FILTER (WHERE status = 'approved') AS confirmed_bookings,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_bookings,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
      COUNT(*) FILTER (WHERE attended = true) AS total_attended,
      COUNT(DISTINCT student_id) AS active_students
    FROM bookings b
    JOIN classes c ON c.id = b.class_id
    WHERE b.tenant_id = p_tenant_id
      AND c.starts_at::date >= p_start_date
      AND c.starts_at::date <= p_end_date
  ),
  student_stats AS (
    SELECT COUNT(*) AS total_students
    FROM students
    WHERE tenant_id = p_tenant_id AND is_active = true
  )
  SELECT 
    COALESCE(cs.total_classes, 0)::BIGINT,
    COALESCE(bs.total_bookings, 0)::BIGINT,
    COALESCE(bs.confirmed_bookings, 0)::BIGINT,
    COALESCE(bs.pending_bookings, 0)::BIGINT,
    COALESCE(bs.cancelled_bookings, 0)::BIGINT,
    COALESCE(bs.total_attended, 0)::BIGINT,
    COALESCE(ss.total_students, 0)::BIGINT,
    COALESCE(bs.active_students, 0)::BIGINT,
    COALESCE(cs.total_capacity, 0)::BIGINT,
    CASE 
      WHEN cs.total_capacity > 0 
      THEN ROUND((bs.confirmed_bookings::NUMERIC / cs.total_capacity::NUMERIC) * 100, 2)
      ELSE 0
    END,
    CASE 
      WHEN bs.confirmed_bookings > 0 
      THEN ROUND((bs.total_attended::NUMERIC / bs.confirmed_bookings::NUMERIC) * 100, 2)
      ELSE 0
    END,
    CASE 
      WHEN bs.total_bookings > 0 
      THEN ROUND((bs.cancelled_bookings::NUMERIC / bs.total_bookings::NUMERIC) * 100, 2)
      ELSE 0
    END
  FROM class_stats cs, booking_stats bs, student_stats ss;
END;
$$;

-- 4. Admin Dashboard: Platform usage stats
CREATE OR REPLACE FUNCTION get_admin_platform_stats(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_teachers BIGINT,
  active_teachers BIGINT,
  pending_teachers BIGINT,
  blocked_teachers BIGINT,
  total_students BIGINT,
  active_students BIGINT,
  total_classes BIGINT,
  total_bookings BIGINT,
  total_subscriptions BIGINT,
  active_subscriptions BIGINT,
  trial_subscriptions BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH teacher_stats AS (
    SELECT 
      COUNT(*) AS total_teachers,
      COUNT(*) FILTER (WHERE status = 'active') AS active_teachers,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_teachers,
      COUNT(*) FILTER (WHERE status = 'blocked' OR status = 'banned') AS blocked_teachers
    FROM teachers
  ),
  student_stats AS (
    SELECT 
      COUNT(*) AS total_students,
      COUNT(*) FILTER (WHERE is_active = true) AS active_students
    FROM students
  ),
  class_stats AS (
    SELECT COUNT(*) AS total_classes
    FROM classes
    WHERE starts_at::date >= p_start_date
      AND starts_at::date <= p_end_date
      AND is_cancelled = false
  ),
  booking_stats AS (
    SELECT COUNT(*) AS total_bookings
    FROM bookings b
    JOIN classes c ON c.id = b.class_id
    WHERE c.starts_at::date >= p_start_date
      AND c.starts_at::date <= p_end_date
  ),
  subscription_stats AS (
    SELECT 
      COUNT(*) AS total_subscriptions,
      COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions,
      COUNT(*) FILTER (WHERE is_trial = true AND status = 'active') AS trial_subscriptions
    FROM subscriptions
  )
  SELECT 
    COALESCE(ts.total_teachers, 0)::BIGINT,
    COALESCE(ts.active_teachers, 0)::BIGINT,
    COALESCE(ts.pending_teachers, 0)::BIGINT,
    COALESCE(ts.blocked_teachers, 0)::BIGINT,
    COALESCE(ss.total_students, 0)::BIGINT,
    COALESCE(ss.active_students, 0)::BIGINT,
    COALESCE(cs.total_classes, 0)::BIGINT,
    COALESCE(bs.total_bookings, 0)::BIGINT,
    COALESCE(subs.total_subscriptions, 0)::BIGINT,
    COALESCE(subs.active_subscriptions, 0)::BIGINT,
    COALESCE(subs.trial_subscriptions, 0)::BIGINT
  FROM teacher_stats ts, student_stats ss, class_stats cs, booking_stats bs, subscription_stats subs;
END;
$$;

-- 5. Admin Dashboard: Conversion funnel
CREATE OR REPLACE FUNCTION get_admin_conversion_funnel(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  stage TEXT,
  count BIGINT,
  percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_signups BIGINT;
  v_completed_onboarding BIGINT;
  v_first_class BIGINT;
  v_subscribed BIGINT;
BEGIN
  -- Total signups (teachers created in period)
  SELECT COUNT(*) INTO v_total_signups
  FROM teachers
  WHERE created_at::date >= p_start_date AND created_at::date <= p_end_date;

  -- Completed onboarding (teachers with active status)
  SELECT COUNT(*) INTO v_completed_onboarding
  FROM teachers
  WHERE created_at::date >= p_start_date 
    AND created_at::date <= p_end_date
    AND status = 'active';

  -- Teachers with at least one class
  SELECT COUNT(DISTINCT tenant_id) INTO v_first_class
  FROM classes
  WHERE created_at::date >= p_start_date AND created_at::date <= p_end_date;

  -- Teachers with active subscriptions (students subscribed)
  SELECT COUNT(DISTINCT tenant_id) INTO v_subscribed
  FROM subscriptions
  WHERE created_at::date >= p_start_date 
    AND created_at::date <= p_end_date
    AND status = 'active';

  RETURN QUERY
  SELECT 'Cadastros'::TEXT, v_total_signups, 100.00::NUMERIC
  UNION ALL
  SELECT 'Onboarding Completo'::TEXT, v_completed_onboarding, 
    CASE WHEN v_total_signups > 0 THEN ROUND((v_completed_onboarding::NUMERIC / v_total_signups::NUMERIC) * 100, 2) ELSE 0 END
  UNION ALL
  SELECT 'Primeira Aula'::TEXT, v_first_class,
    CASE WHEN v_total_signups > 0 THEN ROUND((v_first_class::NUMERIC / v_total_signups::NUMERIC) * 100, 2) ELSE 0 END
  UNION ALL
  SELECT 'Assinaturas Ativas'::TEXT, v_subscribed,
    CASE WHEN v_total_signups > 0 THEN ROUND((v_subscribed::NUMERIC / v_total_signups::NUMERIC) * 100, 2) ELSE 0 END;
END;
$$;

-- 6. Admin Dashboard: Subscription status breakdown
CREATE OR REPLACE FUNCTION get_admin_subscription_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  percentage NUMERIC,
  total_revenue_cents BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM subscriptions;

  RETURN QUERY
  SELECT 
    s.status::TEXT,
    COUNT(s.id)::BIGINT AS count,
    CASE 
      WHEN v_total > 0 THEN ROUND((COUNT(s.id)::NUMERIC / v_total::NUMERIC) * 100, 2) 
      ELSE 0 
    END AS percentage,
    COALESCE(SUM(p.price_cents), 0)::BIGINT AS total_revenue_cents
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  GROUP BY s.status
  ORDER BY count DESC;
END;
$$;

-- 7. Admin Dashboard: Platform usage over time
CREATE OR REPLACE FUNCTION get_admin_usage_over_time(
  p_start_date DATE,
  p_end_date DATE,
  p_group_by TEXT DEFAULT 'day'
)
RETURNS TABLE (
  period TEXT,
  new_teachers BIGINT,
  new_students BIGINT,
  classes_created BIGINT,
  bookings_made BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS dt
  ),
  periods AS (
    SELECT DISTINCT
      CASE 
        WHEN p_group_by = 'day' THEN TO_CHAR(dt, 'YYYY-MM-DD')
        WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', dt), 'YYYY-"W"IW')
        WHEN p_group_by = 'month' THEN TO_CHAR(dt, 'YYYY-MM')
        ELSE TO_CHAR(dt, 'YYYY-MM-DD')
      END AS period,
      dt
    FROM date_series
  ),
  teacher_data AS (
    SELECT 
      CASE 
        WHEN p_group_by = 'day' THEN TO_CHAR(created_at::date, 'YYYY-MM-DD')
        WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', created_at::date), 'YYYY-"W"IW')
        WHEN p_group_by = 'month' THEN TO_CHAR(created_at::date, 'YYYY-MM')
        ELSE TO_CHAR(created_at::date, 'YYYY-MM-DD')
      END AS period,
      COUNT(*) AS cnt
    FROM teachers
    WHERE created_at::date >= p_start_date AND created_at::date <= p_end_date
    GROUP BY 1
  ),
  student_data AS (
    SELECT 
      CASE 
        WHEN p_group_by = 'day' THEN TO_CHAR(created_at::date, 'YYYY-MM-DD')
        WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', created_at::date), 'YYYY-"W"IW')
        WHEN p_group_by = 'month' THEN TO_CHAR(created_at::date, 'YYYY-MM')
        ELSE TO_CHAR(created_at::date, 'YYYY-MM-DD')
      END AS period,
      COUNT(*) AS cnt
    FROM students
    WHERE created_at::date >= p_start_date AND created_at::date <= p_end_date
    GROUP BY 1
  ),
  class_data AS (
    SELECT 
      CASE 
        WHEN p_group_by = 'day' THEN TO_CHAR(created_at::date, 'YYYY-MM-DD')
        WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', created_at::date), 'YYYY-"W"IW')
        WHEN p_group_by = 'month' THEN TO_CHAR(created_at::date, 'YYYY-MM')
        ELSE TO_CHAR(created_at::date, 'YYYY-MM-DD')
      END AS period,
      COUNT(*) AS cnt
    FROM classes
    WHERE created_at::date >= p_start_date AND created_at::date <= p_end_date
    GROUP BY 1
  ),
  booking_data AS (
    SELECT 
      CASE 
        WHEN p_group_by = 'day' THEN TO_CHAR(created_at::date, 'YYYY-MM-DD')
        WHEN p_group_by = 'week' THEN TO_CHAR(DATE_TRUNC('week', created_at::date), 'YYYY-"W"IW')
        WHEN p_group_by = 'month' THEN TO_CHAR(created_at::date, 'YYYY-MM')
        ELSE TO_CHAR(created_at::date, 'YYYY-MM-DD')
      END AS period,
      COUNT(*) AS cnt
    FROM bookings
    WHERE created_at::date >= p_start_date AND created_at::date <= p_end_date
    GROUP BY 1
  )
  SELECT DISTINCT
    p.period,
    COALESCE(td.cnt, 0)::BIGINT AS new_teachers,
    COALESCE(sd.cnt, 0)::BIGINT AS new_students,
    COALESCE(cd.cnt, 0)::BIGINT AS classes_created,
    COALESCE(bd.cnt, 0)::BIGINT AS bookings_made
  FROM periods p
  LEFT JOIN teacher_data td ON td.period = p.period
  LEFT JOIN student_data sd ON sd.period = p.period
  LEFT JOIN class_data cd ON cd.period = p.period
  LEFT JOIN booking_data bd ON bd.period = p.period
  ORDER BY p.period;
END;
$$;

-- 8. Export data function for teacher reports
CREATE OR REPLACE FUNCTION get_teacher_export_data(
  p_tenant_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_export_type TEXT DEFAULT 'bookings' -- 'bookings', 'students', 'classes'
)
RETURNS TABLE (
  data JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_export_type = 'bookings' THEN
    RETURN QUERY
    SELECT jsonb_build_object(
      'data_aula', TO_CHAR(c.starts_at, 'DD/MM/YYYY HH24:MI'),
      'aluno', s.name,
      'email', s.email,
      'status', b.status,
      'compareceu', CASE WHEN b.attended THEN 'Sim' ELSE 'Não' END,
      'observacoes', b.notes
    ) AS data
    FROM bookings b
    JOIN classes c ON c.id = b.class_id
    JOIN students s ON s.id = b.student_id
    WHERE b.tenant_id = p_tenant_id
      AND c.starts_at::date >= p_start_date
      AND c.starts_at::date <= p_end_date
    ORDER BY c.starts_at DESC;
  ELSIF p_export_type = 'students' THEN
    RETURN QUERY
    SELECT jsonb_build_object(
      'nome', s.name,
      'email', s.email,
      'telefone', s.phone,
      'contato_emergencia', s.emergency_contact,
      'telefone_emergencia', s.emergency_phone,
      'ativo', CASE WHEN s.is_active THEN 'Sim' ELSE 'Não' END,
      'data_cadastro', TO_CHAR(s.created_at, 'DD/MM/YYYY'),
      'observacoes', s.notes
    ) AS data
    FROM students s
    WHERE s.tenant_id = p_tenant_id
    ORDER BY s.name;
  ELSIF p_export_type = 'classes' THEN
    RETURN QUERY
    SELECT jsonb_build_object(
      'data_hora', TO_CHAR(c.starts_at, 'DD/MM/YYYY HH24:MI'),
      'duracao', EXTRACT(EPOCH FROM (c.ends_at - c.starts_at))/60 || ' min',
      'capacidade', c.max_students,
      'cancelada', CASE WHEN c.is_cancelled THEN 'Sim' ELSE 'Não' END,
      'reservas', (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status = 'approved'),
      'observacoes', c.notes
    ) AS data
    FROM classes c
    WHERE c.tenant_id = p_tenant_id
      AND c.starts_at::date >= p_start_date
      AND c.starts_at::date <= p_end_date
    ORDER BY c.starts_at DESC;
  END IF;
END;
$$;