-- Add auto_approval_enabled to teachers settings
-- This is stored in the settings JSONB column as: {"auto_approval_enabled": true/false}

-- Create booking transaction function with row-level locking
CREATE OR REPLACE FUNCTION public.create_booking_with_lock(
  p_tenant_id uuid,
  p_class_id uuid,
  p_student_id uuid,
  p_notes text DEFAULT NULL,
  p_auto_approve boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class record;
  v_current_bookings int;
  v_booking_id uuid;
  v_status booking_status;
BEGIN
  -- Lock the class row to prevent race conditions
  SELECT * INTO v_class
  FROM classes
  WHERE id = p_class_id AND tenant_id = p_tenant_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Class not found');
  END IF;
  
  -- Check if class is cancelled
  IF v_class.is_cancelled THEN
    RETURN json_build_object('success', false, 'error', 'Class is cancelled');
  END IF;
  
  -- Check if class is in the past
  IF v_class.starts_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Cannot book past classes');
  END IF;
  
  -- Count current active bookings (pending + confirmed)
  SELECT COUNT(*) INTO v_current_bookings
  FROM bookings
  WHERE class_id = p_class_id
    AND status IN ('pending', 'confirmed');
  
  -- Check capacity
  IF v_current_bookings >= v_class.max_students THEN
    RETURN json_build_object('success', false, 'error', 'Class is full');
  END IF;
  
  -- Check if student already has booking for this class
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE class_id = p_class_id
      AND student_id = p_student_id
      AND status IN ('pending', 'confirmed')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Student already booked');
  END IF;
  
  -- Determine status based on auto-approval
  v_status := CASE WHEN p_auto_approve THEN 'confirmed' ELSE 'pending' END;
  
  -- Create booking
  INSERT INTO bookings (tenant_id, class_id, student_id, status, notes, booked_at)
  VALUES (p_tenant_id, p_class_id, p_student_id, v_status, p_notes, now())
  RETURNING id INTO v_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'status', v_status,
    'available_spots', v_class.max_students - v_current_bookings - 1
  );
END;
$$;

-- Function to create multiple bookings in a transaction (requires approval)
CREATE OR REPLACE FUNCTION public.create_bulk_bookings(
  p_tenant_id uuid,
  p_student_id uuid,
  p_class_ids uuid[],
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_class_id uuid;
  v_class record;
  v_current_bookings int;
  v_booking_ids uuid[] := '{}';
  v_booking_id uuid;
  v_errors text[] := '{}';
BEGIN
  -- Validate minimum 2 classes for bulk booking
  IF array_length(p_class_ids, 1) < 2 THEN
    RETURN json_build_object('success', false, 'error', 'Bulk booking requires at least 2 classes');
  END IF;

  -- Lock all classes in order to prevent deadlocks
  FOR v_class IN 
    SELECT * FROM classes 
    WHERE id = ANY(p_class_ids) AND tenant_id = p_tenant_id
    ORDER BY id
    FOR UPDATE
  LOOP
    -- Check if class is cancelled
    IF v_class.is_cancelled THEN
      v_errors := array_append(v_errors, 'Class ' || v_class.id || ' is cancelled');
      CONTINUE;
    END IF;
    
    -- Check if class is in the past
    IF v_class.starts_at < now() THEN
      v_errors := array_append(v_errors, 'Class ' || v_class.id || ' is in the past');
      CONTINUE;
    END IF;
    
    -- Count current bookings
    SELECT COUNT(*) INTO v_current_bookings
    FROM bookings
    WHERE class_id = v_class.id AND status IN ('pending', 'confirmed');
    
    -- Check capacity
    IF v_current_bookings >= v_class.max_students THEN
      v_errors := array_append(v_errors, 'Class ' || v_class.id || ' is full');
      CONTINUE;
    END IF;
    
    -- Check if already booked
    IF EXISTS (
      SELECT 1 FROM bookings
      WHERE class_id = v_class.id AND student_id = p_student_id AND status IN ('pending', 'confirmed')
    ) THEN
      v_errors := array_append(v_errors, 'Already booked for class ' || v_class.id);
      CONTINUE;
    END IF;
    
    -- Create booking with pending status (bulk always requires approval)
    INSERT INTO bookings (tenant_id, class_id, student_id, status, notes, booked_at)
    VALUES (p_tenant_id, v_class.id, p_student_id, 'pending', p_notes, now())
    RETURNING id INTO v_booking_id;
    
    v_booking_ids := array_append(v_booking_ids, v_booking_id);
  END LOOP;
  
  -- If no bookings were created, rollback
  IF array_length(v_booking_ids, 1) IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No bookings could be created',
      'errors', v_errors
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'booking_ids', v_booking_ids,
    'status', 'pending',
    'message', 'Bulk bookings require approval',
    'errors', CASE WHEN array_length(v_errors, 1) > 0 THEN v_errors ELSE NULL END
  );
END;
$$;

-- Function to approve/reject bookings with validation
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_tenant_id uuid,
  p_booking_id uuid,
  p_new_status booking_status,
  p_actor_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_class record;
  v_current_confirmed int;
BEGIN
  -- Lock booking row
  SELECT b.*, c.max_students, c.is_cancelled, c.starts_at as class_starts_at
  INTO v_booking
  FROM bookings b
  JOIN classes c ON c.id = b.class_id
  WHERE b.id = p_booking_id AND b.tenant_id = p_tenant_id
  FOR UPDATE OF b;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Validate status transition
  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot update cancelled booking');
  END IF;
  
  IF v_booking.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot update completed booking');
  END IF;
  
  -- If approving, check capacity again
  IF p_new_status = 'confirmed' AND v_booking.status != 'confirmed' THEN
    SELECT COUNT(*) INTO v_current_confirmed
    FROM bookings
    WHERE class_id = v_booking.class_id
      AND status = 'confirmed'
      AND id != p_booking_id;
    
    IF v_current_confirmed >= v_booking.max_students THEN
      RETURN json_build_object('success', false, 'error', 'Class is now full');
    END IF;
  END IF;
  
  -- Update booking
  UPDATE bookings
  SET 
    status = p_new_status,
    cancelled_at = CASE WHEN p_new_status = 'cancelled' THEN now() ELSE cancelled_at END,
    notes = CASE WHEN p_reason IS NOT NULL THEN COALESCE(notes || ' | ', '') || p_reason ELSE notes END,
    updated_at = now()
  WHERE id = p_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'old_status', v_booking.status,
    'new_status', p_new_status
  );
END;
$$;

-- Function to cancel booking by student (with time restrictions)
CREATE OR REPLACE FUNCTION public.cancel_booking_by_student(
  p_booking_id uuid,
  p_student_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking record;
  v_min_cancel_hours int := 24; -- Configurable cancellation window
BEGIN
  -- Get booking with class info
  SELECT b.*, c.starts_at as class_starts_at, t.settings
  INTO v_booking
  FROM bookings b
  JOIN classes c ON c.id = b.class_id
  JOIN teachers t ON t.id = b.tenant_id
  WHERE b.id = p_booking_id AND b.student_id = p_student_id
  FOR UPDATE OF b;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  IF v_booking.status IN ('cancelled', 'completed', 'no_show') THEN
    RETURN json_build_object('success', false, 'error', 'Booking cannot be cancelled');
  END IF;
  
  -- Check cancellation window (default 24h, can be customized in teacher settings)
  v_min_cancel_hours := COALESCE((v_booking.settings->>'min_cancel_hours')::int, 24);
  
  IF v_booking.class_starts_at < now() + (v_min_cancel_hours || ' hours')::interval THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Cancellation window has passed (' || v_min_cancel_hours || 'h before class)'
    );
  END IF;
  
  -- Cancel booking
  UPDATE bookings
  SET 
    status = 'cancelled',
    cancelled_at = now(),
    notes = CASE WHEN p_reason IS NOT NULL THEN COALESCE(notes || ' | ', '') || 'Student cancelled: ' || p_reason ELSE notes END,
    updated_at = now()
  WHERE id = p_booking_id;
  
  RETURN json_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'message', 'Booking cancelled successfully'
  );
END;
$$;

-- Index for efficient booking queries
CREATE INDEX IF NOT EXISTS idx_bookings_student_status ON bookings(student_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_status ON bookings(tenant_id, status);