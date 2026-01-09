-- Add event_type to classes for distinguishing class/private events
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS event_type varchar(20) DEFAULT 'class' CHECK (event_type IN ('class', 'private', 'block'));

-- Add recurrence support to classes for one-time vs recurring
ALTER TABLE public.classes
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_rule text;

-- Create composite indexes for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_classes_tenant_dates ON public.classes (tenant_id, starts_at, ends_at) WHERE is_cancelled = false;
CREATE INDEX IF NOT EXISTS idx_blocks_tenant_dates ON public.blocks (tenant_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_bookings_class_status ON public.bookings (class_id, status) WHERE status IN ('confirmed', 'pending');
CREATE INDEX IF NOT EXISTS idx_schedules_tenant_day ON public.schedules (tenant_id, day_of_week) WHERE is_active = true;

-- Function to check for time range overlap
CREATE OR REPLACE FUNCTION public.time_ranges_overlap(
  start1 timestamptz, end1 timestamptz,
  start2 timestamptz, end2 timestamptz
) RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT start1 < end2 AND end1 > start2
$$;

-- Function to detect conflicts for a given time range
CREATE OR REPLACE FUNCTION public.detect_schedule_conflicts(
  p_tenant_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_class_id uuid DEFAULT NULL,
  p_exclude_block_id uuid DEFAULT NULL
) RETURNS TABLE (
  conflict_type varchar,
  conflict_id uuid,
  conflict_starts_at timestamptz,
  conflict_ends_at timestamptz,
  conflict_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check for conflicting classes
  RETURN QUERY
  SELECT 
    'class'::varchar as conflict_type,
    c.id as conflict_id,
    c.starts_at as conflict_starts_at,
    c.ends_at as conflict_ends_at,
    jsonb_build_object(
      'event_type', c.event_type,
      'class_type_id', c.class_type_id,
      'has_bookings', EXISTS (
        SELECT 1 FROM bookings b 
        WHERE b.class_id = c.id 
        AND b.status IN ('confirmed', 'pending')
      )
    ) as conflict_details
  FROM classes c
  WHERE c.tenant_id = p_tenant_id
    AND c.is_cancelled = false
    AND (p_exclude_class_id IS NULL OR c.id != p_exclude_class_id)
    AND time_ranges_overlap(c.starts_at, c.ends_at, p_starts_at, p_ends_at);

  -- Check for conflicting blocks
  RETURN QUERY
  SELECT 
    'block'::varchar as conflict_type,
    b.id as conflict_id,
    b.starts_at as conflict_starts_at,
    b.ends_at as conflict_ends_at,
    jsonb_build_object(
      'title', b.title,
      'reason', b.reason,
      'is_recurring', b.is_recurring
    ) as conflict_details
  FROM blocks b
  WHERE b.tenant_id = p_tenant_id
    AND (p_exclude_block_id IS NULL OR b.id != p_exclude_block_id)
    AND time_ranges_overlap(b.starts_at, b.ends_at, p_starts_at, p_ends_at);
END;
$$;

-- Function to check if a block can be created (no confirmed bookings in range)
CREATE OR REPLACE FUNCTION public.can_create_block(
  p_tenant_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocking_bookings jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object(
    'booking_id', b.id,
    'class_id', b.class_id,
    'student_id', b.student_id,
    'status', b.status,
    'class_starts_at', c.starts_at
  ))
  INTO v_blocking_bookings
  FROM bookings b
  JOIN classes c ON c.id = b.class_id
  WHERE c.tenant_id = p_tenant_id
    AND c.is_cancelled = false
    AND b.status IN ('confirmed', 'pending')
    AND time_ranges_overlap(c.starts_at, c.ends_at, p_starts_at, p_ends_at);

  IF v_blocking_bookings IS NOT NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Cannot block time with existing bookings',
      'blocking_bookings', v_blocking_bookings
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

-- Function to get availability slots for a date range
CREATE OR REPLACE FUNCTION public.get_availability_slots(
  p_tenant_id uuid,
  p_from_date date,
  p_to_date date,
  p_timezone varchar DEFAULT 'UTC'
) RETURNS TABLE (
  slot_date date,
  slot_start time,
  slot_end time,
  slot_starts_at timestamptz,
  slot_ends_at timestamptz,
  source_type varchar,
  source_id uuid,
  class_type_id uuid,
  class_type_name varchar,
  max_students integer,
  current_bookings integer,
  available_spots integer,
  is_available boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_date date;
  v_day_of_week day_of_week;
BEGIN
  -- Generate slots from schedules (recurring weekly)
  FOR v_current_date IN SELECT generate_series(p_from_date, p_to_date, '1 day'::interval)::date
  LOOP
    -- Map date to day_of_week enum
    v_day_of_week := LOWER(to_char(v_current_date, 'fmday'))::day_of_week;
    
    RETURN QUERY
    SELECT
      v_current_date as slot_date,
      s.start_time as slot_start,
      s.end_time as slot_end,
      (v_current_date || ' ' || s.start_time)::timestamptz AT TIME ZONE p_timezone as slot_starts_at,
      (v_current_date || ' ' || s.end_time)::timestamptz AT TIME ZONE p_timezone as slot_ends_at,
      'schedule'::varchar as source_type,
      s.id as source_id,
      s.class_type_id,
      ct.name as class_type_name,
      COALESCE(s.max_students, ct.max_students) as max_students,
      0::integer as current_bookings,
      COALESCE(s.max_students, ct.max_students)::integer as available_spots,
      true as is_available
    FROM schedules s
    JOIN class_types ct ON ct.id = s.class_type_id
    WHERE s.tenant_id = p_tenant_id
      AND s.is_active = true
      AND s.day_of_week = v_day_of_week
      AND (s.valid_from IS NULL OR s.valid_from <= v_current_date)
      AND (s.valid_until IS NULL OR s.valid_until >= v_current_date)
      -- Exclude if there's a block
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.tenant_id = p_tenant_id
          AND time_ranges_overlap(
            b.starts_at, b.ends_at,
            (v_current_date || ' ' || s.start_time)::timestamptz AT TIME ZONE p_timezone,
            (v_current_date || ' ' || s.end_time)::timestamptz AT TIME ZONE p_timezone
          )
      );
  END LOOP;

  -- Add one-time classes
  RETURN QUERY
  SELECT
    c.starts_at::date as slot_date,
    c.starts_at::time as slot_start,
    c.ends_at::time as slot_end,
    c.starts_at as slot_starts_at,
    c.ends_at as slot_ends_at,
    'class'::varchar as source_type,
    c.id as source_id,
    c.class_type_id,
    ct.name as class_type_name,
    c.max_students,
    (SELECT COUNT(*)::integer FROM bookings b WHERE b.class_id = c.id AND b.status IN ('confirmed', 'pending')) as current_bookings,
    c.max_students - (SELECT COUNT(*)::integer FROM bookings b WHERE b.class_id = c.id AND b.status IN ('confirmed', 'pending')) as available_spots,
    c.max_students > (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status IN ('confirmed', 'pending')) as is_available
  FROM classes c
  JOIN class_types ct ON ct.id = c.class_type_id
  WHERE c.tenant_id = p_tenant_id
    AND c.is_cancelled = false
    AND c.event_type = 'class'
    AND c.starts_at::date BETWEEN p_from_date AND p_to_date;
END;
$$;

-- Function to expand recurring schedule to class instances
CREATE OR REPLACE FUNCTION public.expand_schedule_to_classes(
  p_schedule_id uuid,
  p_from_date date,
  p_to_date date
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule schedules%ROWTYPE;
  v_current_date date;
  v_day_number integer;
  v_classes_created integer := 0;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_teacher_tz varchar;
BEGIN
  SELECT * INTO v_schedule FROM schedules WHERE id = p_schedule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule not found: %', p_schedule_id;
  END IF;

  -- Get teacher timezone
  SELECT timezone INTO v_teacher_tz FROM teachers WHERE id = v_schedule.tenant_id;
  v_teacher_tz := COALESCE(v_teacher_tz, 'UTC');

  -- Map day_of_week to day number (0=Sunday, 1=Monday, etc.)
  v_day_number := CASE v_schedule.day_of_week
    WHEN 'sunday' THEN 0
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
  END;

  FOR v_current_date IN 
    SELECT generate_series(
      p_from_date + ((v_day_number - EXTRACT(DOW FROM p_from_date)::integer + 7) % 7),
      p_to_date,
      '7 days'::interval
    )::date
  LOOP
    -- Skip if outside valid range
    IF v_schedule.valid_from IS NOT NULL AND v_current_date < v_schedule.valid_from THEN
      CONTINUE;
    END IF;
    IF v_schedule.valid_until IS NOT NULL AND v_current_date > v_schedule.valid_until THEN
      CONTINUE;
    END IF;

    -- Calculate timestamps in teacher's timezone
    v_starts_at := (v_current_date || ' ' || v_schedule.start_time)::timestamp AT TIME ZONE v_teacher_tz;
    v_ends_at := (v_current_date || ' ' || v_schedule.end_time)::timestamp AT TIME ZONE v_teacher_tz;

    -- Skip if class already exists or conflicts
    IF NOT EXISTS (
      SELECT 1 FROM classes c
      WHERE c.tenant_id = v_schedule.tenant_id
        AND c.schedule_id = p_schedule_id
        AND c.starts_at = v_starts_at
    ) AND NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE b.tenant_id = v_schedule.tenant_id
        AND time_ranges_overlap(b.starts_at, b.ends_at, v_starts_at, v_ends_at)
    ) THEN
      INSERT INTO classes (
        tenant_id, class_type_id, schedule_id, starts_at, ends_at, 
        max_students, event_type, is_recurring
      ) VALUES (
        v_schedule.tenant_id, v_schedule.class_type_id, p_schedule_id,
        v_starts_at, v_ends_at,
        COALESCE(v_schedule.max_students, (SELECT max_students FROM class_types WHERE id = v_schedule.class_type_id)),
        'class', true
      );
      v_classes_created := v_classes_created + 1;
    END IF;
  END LOOP;

  RETURN v_classes_created;
END;
$$;