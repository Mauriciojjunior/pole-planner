import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SingleBookingPayload {
  classId: string;
  notes?: string;
}

interface BulkBookingPayload {
  classIds: string[];
  notes?: string;
}

interface StatusUpdatePayload {
  bookingId: string;
  status: 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  reason?: string;
}

interface CancelPayload {
  bookingId: string;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get profile
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('external_auth_id', userData.user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Route based on action
    switch (action) {
      case 'create':
        return handleCreateBooking(req, serviceClient, profile.id);
      case 'create-bulk':
        return handleBulkBooking(req, serviceClient, profile.id);
      case 'update-status':
        return handleUpdateStatus(req, serviceClient, profile.id);
      case 'cancel':
        return handleStudentCancel(req, serviceClient, profile.id);
      case 'list':
        return handleListBookings(req, serviceClient, profile.id, url);
      case 'teacher-list':
        return handleTeacherListBookings(req, serviceClient, profile.id, url);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: create, create-bulk, update-status, cancel, list, teacher-list' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Booking error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Student creates a single booking
async function handleCreateBooking(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  profileId: string
) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const payload: SingleBookingPayload = await req.json();

  if (!payload.classId) {
    return new Response(
      JSON.stringify({ error: 'classId is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get the class to find tenant_id
  const { data: classData, error: classError } = await client
    .from('classes')
    .select('tenant_id, starts_at, ends_at, max_students, is_cancelled')
    .eq('id', payload.classId)
    .single();

  if (classError || !classData) {
    return new Response(
      JSON.stringify({ error: 'Class not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const tenantId = classData.tenant_id;

  // Get student record for this profile in this tenant
  const { data: student } = await client
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .eq('tenant_id', tenantId)
    .single();

  if (!student) {
    return new Response(
      JSON.stringify({ error: 'You are not registered as a student with this teacher' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check teacher's auto-approval setting
  const { data: teacher } = await client
    .from('teachers')
    .select('settings')
    .eq('id', tenantId)
    .single();

  const autoApprove = teacher?.settings?.auto_approval_enabled === true;

  // Use transaction function
  const { data: result, error: bookingError } = await client.rpc('create_booking_with_lock', {
    p_tenant_id: tenantId,
    p_class_id: payload.classId,
    p_student_id: student.id,
    p_notes: payload.notes || null,
    p_auto_approve: autoApprove,
  });

  if (bookingError) {
    console.error('Booking RPC error:', bookingError);
    return new Response(
      JSON.stringify({ error: 'Failed to create booking' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Audit log
  await client.from('audit_logs').insert({
    tenant_id: tenantId,
    entity_type: 'booking',
    entity_id: result.booking_id,
    action: 'booking_created',
    actor_id: profileId,
    actor_type: 'student',
    new_values: { status: result.status, class_id: payload.classId },
  });

  return new Response(
    JSON.stringify({
      success: true,
      booking_id: result.booking_id,
      status: result.status,
      available_spots: result.available_spots,
      message: result.status === 'confirmed' 
        ? 'Booking confirmed automatically' 
        : 'Booking pending approval',
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Student creates bulk bookings (always requires approval)
async function handleBulkBooking(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  profileId: string
) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const payload: BulkBookingPayload = await req.json();

  if (!payload.classIds || payload.classIds.length < 2) {
    return new Response(
      JSON.stringify({ error: 'At least 2 classIds required for bulk booking' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get tenant from first class
  const { data: firstClass } = await client
    .from('classes')
    .select('tenant_id')
    .eq('id', payload.classIds[0])
    .single();

  if (!firstClass) {
    return new Response(
      JSON.stringify({ error: 'Class not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const tenantId = firstClass.tenant_id;

  // Verify all classes belong to same tenant
  const { data: classes } = await client
    .from('classes')
    .select('id, tenant_id')
    .in('id', payload.classIds);

  const invalidClasses = classes?.filter((c: { tenant_id: string }) => c.tenant_id !== tenantId);
  if (invalidClasses && invalidClasses.length > 0) {
    return new Response(
      JSON.stringify({ error: 'All classes must belong to the same teacher' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get student
  const { data: student } = await client
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .eq('tenant_id', tenantId)
    .single();

  if (!student) {
    return new Response(
      JSON.stringify({ error: 'You are not registered as a student with this teacher' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Use bulk booking function (always pending)
  const { data: result, error: bookingError } = await client.rpc('create_bulk_bookings', {
    p_tenant_id: tenantId,
    p_student_id: student.id,
    p_class_ids: payload.classIds,
    p_notes: payload.notes || null,
  });

  if (bookingError) {
    console.error('Bulk booking RPC error:', bookingError);
    return new Response(
      JSON.stringify({ error: 'Failed to create bookings' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error, errors: result.errors }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Audit log
  await client.from('audit_logs').insert({
    tenant_id: tenantId,
    entity_type: 'booking',
    entity_id: result.booking_ids[0],
    action: 'bulk_booking_created',
    actor_id: profileId,
    actor_type: 'student',
    new_values: { booking_ids: result.booking_ids, class_ids: payload.classIds },
  });

  return new Response(
    JSON.stringify({
      success: true,
      booking_ids: result.booking_ids,
      status: 'pending',
      message: 'Bulk bookings require teacher approval',
      errors: result.errors,
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Teacher updates booking status (approve/reject/etc)
async function handleUpdateStatus(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  profileId: string
) {
  if (req.method !== 'PATCH') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const payload: StatusUpdatePayload = await req.json();

  if (!payload.bookingId || !payload.status) {
    return new Response(
      JSON.stringify({ error: 'bookingId and status are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const validStatuses = ['confirmed', 'cancelled', 'no_show', 'completed'];
  if (!validStatuses.includes(payload.status)) {
    return new Response(
      JSON.stringify({ error: `Invalid status. Use: ${validStatuses.join(', ')}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify teacher role
  const { data: teacherRole } = await client
    .from('user_roles')
    .select('tenant_id')
    .eq('profile_id', profileId)
    .eq('role', 'teacher')
    .single();

  if (!teacherRole) {
    return new Response(
      JSON.stringify({ error: 'Teacher access required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Use transaction function
  const { data: result, error } = await client.rpc('update_booking_status', {
    p_tenant_id: teacherRole.tenant_id,
    p_booking_id: payload.bookingId,
    p_new_status: payload.status,
    p_actor_id: profileId,
    p_reason: payload.reason || null,
  });

  if (error) {
    console.error('Update status RPC error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update booking status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Audit log
  await client.from('audit_logs').insert({
    tenant_id: teacherRole.tenant_id,
    entity_type: 'booking',
    entity_id: payload.bookingId,
    action: `booking_${payload.status}`,
    actor_id: profileId,
    actor_type: 'teacher',
    old_values: { status: result.old_status },
    new_values: { status: result.new_status, reason: payload.reason },
  });

  return new Response(
    JSON.stringify({
      success: true,
      booking_id: payload.bookingId,
      old_status: result.old_status,
      new_status: result.new_status,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Student cancels their own booking
async function handleStudentCancel(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  profileId: string
) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const payload: CancelPayload = await req.json();

  if (!payload.bookingId) {
    return new Response(
      JSON.stringify({ error: 'bookingId is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get student ID from profile
  const { data: booking } = await client
    .from('bookings')
    .select('student_id, students!inner(profile_id)')
    .eq('id', payload.bookingId)
    .single();

  if (!booking || booking.students?.profile_id !== profileId) {
    return new Response(
      JSON.stringify({ error: 'Booking not found or not yours' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Use transaction function
  const { data: result, error } = await client.rpc('cancel_booking_by_student', {
    p_booking_id: payload.bookingId,
    p_student_id: booking.student_id,
    p_reason: payload.reason || null,
  });

  if (error) {
    console.error('Cancel booking RPC error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to cancel booking' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!result.success) {
    return new Response(
      JSON.stringify({ error: result.error }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      booking_id: payload.bookingId,
      message: 'Booking cancelled successfully',
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Student lists their bookings
async function handleListBookings(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  profileId: string,
  url: URL
) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const status = url.searchParams.get('status');
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');

  // Get all student records for this profile
  const { data: students } = await client
    .from('students')
    .select('id')
    .eq('profile_id', profileId);

  if (!students || students.length === 0) {
    return new Response(
      JSON.stringify({ bookings: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const studentIds = students.map((s: { id: string }) => s.id);

  let query = client
    .from('bookings')
    .select(`
      *,
      class:classes(
        id, starts_at, ends_at, max_students, is_cancelled,
        class_type:class_types(id, name, color, duration_minutes)
      ),
      teacher:classes(tenant_id, teachers:teachers(name, slug))
    `)
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (fromDate) query = query.gte('class.starts_at', fromDate);
  if (toDate) query = query.lte('class.starts_at', toDate);

  const { data: bookings, error } = await query;

  if (error) {
    console.error('List bookings error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bookings' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ bookings }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Teacher lists bookings for their classes
async function handleTeacherListBookings(
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  profileId: string,
  url: URL
) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Verify teacher role
  const { data: teacherRole } = await client
    .from('user_roles')
    .select('tenant_id')
    .eq('profile_id', profileId)
    .eq('role', 'teacher')
    .single();

  if (!teacherRole) {
    return new Response(
      JSON.stringify({ error: 'Teacher access required' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const status = url.searchParams.get('status');
  const classId = url.searchParams.get('classId');
  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');
  const pendingOnly = url.searchParams.get('pending') === 'true';

  let query = client
    .from('bookings')
    .select(`
      *,
      student:students(id, name, email, phone),
      class:classes(id, starts_at, ends_at, class_type:class_types(id, name, color))
    `)
    .eq('tenant_id', teacherRole.tenant_id)
    .order('created_at', { ascending: false });

  if (pendingOnly) query = query.eq('status', 'pending');
  else if (status) query = query.eq('status', status);
  if (classId) query = query.eq('class_id', classId);
  if (fromDate) query = query.gte('class.starts_at', fromDate);
  if (toDate) query = query.lte('class.starts_at', toDate);

  const { data: bookings, error } = await query;

  if (error) {
    console.error('Teacher list bookings error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch bookings' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Count pending approvals
  const { count: pendingCount } = await client
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', teacherRole.tenant_id)
    .eq('status', 'pending');

  return new Response(
    JSON.stringify({ 
      bookings,
      pending_count: pendingCount || 0,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
