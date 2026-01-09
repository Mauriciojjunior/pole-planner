import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulePayload {
  classTypeId: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string; // HH:MM format
  endTime: string;
  maxStudents?: number;
  isPublic?: boolean;
  validFrom?: string; // YYYY-MM-DD
  validUntil?: string;
}

interface ClassPayload {
  classTypeId: string;
  startsAt: string; // ISO timestamp
  endsAt: string;
  maxStudents?: number;
  eventType?: 'class' | 'private' | 'block';
  notes?: string;
}

interface BlockPayload {
  startsAt: string;
  endsAt: string;
  title?: string;
  reason?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

function validateTimeFormat(time: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
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

    // Get teacher ID from profile
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

    const { data: teacherRole } = await serviceClient
      .from('user_roles')
      .select('tenant_id')
      .eq('profile_id', profile.id)
      .eq('role', 'teacher')
      .single();

    if (!teacherRole) {
      return new Response(
        JSON.stringify({ error: 'Teacher access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teacherId = teacherRole.tenant_id;
    const url = new URL(req.url);
    const resource = url.searchParams.get('resource'); // schedules, classes, blocks

    // Route to appropriate handler
    switch (resource) {
      case 'schedules':
        return handleSchedules(req, serviceClient, teacherId, profile.id, url);
      case 'classes':
        return handleClasses(req, serviceClient, teacherId, profile.id, url);
      case 'blocks':
        return handleBlocks(req, serviceClient, teacherId, profile.id, url);
      case 'availability':
        return handleAvailability(req, serviceClient, teacherId, url);
      case 'conflicts':
        return handleConflicts(req, serviceClient, teacherId);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid resource. Use: schedules, classes, blocks, availability, conflicts' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Agenda error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// SCHEDULES - Weekly recurring availability
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSchedules(
  req: Request,
  client: any,
  teacherId: string,
  profileId: string,
  url: URL
) {
  // GET - List schedules
  if (req.method === 'GET') {
    const { data, error } = await client
      .from('schedules')
      .select(`
        *,
        class_type:class_types(id, name, color, duration_minutes)
      `)
      .eq('tenant_id', teacherId)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch schedules' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ schedules: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // POST - Create schedule
  if (req.method === 'POST') {
    const payload: SchedulePayload = await req.json();

    // Validation
    if (!payload.classTypeId || !payload.dayOfWeek || !payload.startTime || !payload.endTime) {
      return new Response(
        JSON.stringify({ error: 'classTypeId, dayOfWeek, startTime, endTime are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateTimeFormat(payload.startTime) || !validateTimeFormat(payload.endTime)) {
      return new Response(
        JSON.stringify({ error: 'Time must be in HH:MM format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (payload.startTime >= payload.endTime) {
      return new Response(
        JSON.stringify({ error: 'End time must be after start time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check class type exists and belongs to tenant
    const { data: classType } = await client
      .from('class_types')
      .select('id, max_students')
      .eq('id', payload.classTypeId)
      .eq('tenant_id', teacherId)
      .single();

    if (!classType) {
      return new Response(
        JSON.stringify({ error: 'Class type not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: schedule, error } = await client
      .from('schedules')
      .insert({
        tenant_id: teacherId,
        class_type_id: payload.classTypeId,
        day_of_week: payload.dayOfWeek,
        start_time: payload.startTime,
        end_time: payload.endTime,
        max_students: payload.maxStudents || classType.max_students,
        is_public: payload.isPublic ?? false,
        valid_from: payload.validFrom || null,
        valid_until: payload.validUntil || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create schedule error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create schedule' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Audit log
    await client.from('audit_logs').insert({
      tenant_id: teacherId,
      entity_type: 'schedule',
      entity_id: schedule.id,
      action: 'schedule_created',
      actor_id: profileId,
      actor_type: 'teacher',
      new_values: schedule,
    });

    return new Response(
      JSON.stringify({ success: true, schedule }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // DELETE - Remove schedule
  if (req.method === 'DELETE') {
    const scheduleId = url.searchParams.get('id');
    if (!scheduleId) {
      return new Response(
        JSON.stringify({ error: 'Schedule ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await client
      .from('schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('tenant_id', teacherId);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete schedule' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// CLASSES - One-time events
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleClasses(
  req: Request,
  client: any,
  teacherId: string,
  profileId: string,
  url: URL
) {
  // GET - List classes
  if (req.method === 'GET') {
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');

    let query = client
      .from('classes')
      .select(`
        *,
        class_type:class_types(id, name, color, duration_minutes),
        bookings:bookings(id, student_id, status)
      `)
      .eq('tenant_id', teacherId)
      .eq('is_cancelled', false)
      .order('starts_at');

    if (fromDate) query = query.gte('starts_at', fromDate);
    if (toDate) query = query.lte('starts_at', toDate);

    const { data, error } = await query;

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch classes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add booking counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const classesWithCounts = data?.map((c: any) => ({
      ...c,
      booking_count: c.bookings?.filter((b: { status: string }) => ['confirmed', 'pending'].includes(b.status)).length || 0,
      available_spots: c.max_students - (c.bookings?.filter((b: { status: string }) => ['confirmed', 'pending'].includes(b.status)).length || 0),
    }));

    return new Response(
      JSON.stringify({ classes: classesWithCounts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // POST - Create class
  if (req.method === 'POST') {
    const payload: ClassPayload = await req.json();

    if (!payload.classTypeId || !payload.startsAt || !payload.endsAt) {
      return new Response(
        JSON.stringify({ error: 'classTypeId, startsAt, endsAt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startsAt = new Date(payload.startsAt);
    const endsAt = new Date(payload.endsAt);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (startsAt >= endsAt) {
      return new Response(
        JSON.stringify({ error: 'End time must be after start time' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for conflicts
    const { data: conflicts } = await client.rpc('detect_schedule_conflicts', {
      p_tenant_id: teacherId,
      p_starts_at: payload.startsAt,
      p_ends_at: payload.endsAt,
    });

    if (conflicts && conflicts.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Time conflict detected',
          conflicts 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get class type
    const { data: classType } = await client
      .from('class_types')
      .select('id, max_students')
      .eq('id', payload.classTypeId)
      .eq('tenant_id', teacherId)
      .single();

    if (!classType) {
      return new Response(
        JSON.stringify({ error: 'Class type not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: newClass, error } = await client
      .from('classes')
      .insert({
        tenant_id: teacherId,
        class_type_id: payload.classTypeId,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt,
        max_students: payload.maxStudents || classType.max_students,
        event_type: payload.eventType || 'class',
        notes: payload.notes || null,
        is_recurring: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Create class error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create class' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await client.from('audit_logs').insert({
      tenant_id: teacherId,
      entity_type: 'class',
      entity_id: newClass.id,
      action: 'class_created',
      actor_id: profileId,
      actor_type: 'teacher',
      new_values: newClass,
    });

    return new Response(
      JSON.stringify({ success: true, class: newClass }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // PATCH - Cancel class
  if (req.method === 'PATCH') {
    const classId = url.searchParams.get('id');
    const { action, reason } = await req.json();

    if (!classId) {
      return new Response(
        JSON.stringify({ error: 'Class ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cancel') {
      const { error } = await client
        .from('classes')
        .update({ 
          is_cancelled: true, 
          cancelled_reason: reason || 'Cancelled by teacher' 
        })
        .eq('id', classId)
        .eq('tenant_id', teacherId);

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to cancel class' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // TODO: Notify booked students

      return new Response(
        JSON.stringify({ success: true, message: 'Class cancelled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// BLOCKS - Time blocks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBlocks(
  req: Request,
  client: any,
  teacherId: string,
  profileId: string,
  url: URL
) {
  // GET - List blocks
  if (req.method === 'GET') {
    const { data, error } = await client
      .from('blocks')
      .select('*')
      .eq('tenant_id', teacherId)
      .order('starts_at');

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch blocks' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ blocks: data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // POST - Create block
  if (req.method === 'POST') {
    const payload: BlockPayload = await req.json();

    if (!payload.startsAt || !payload.endsAt) {
      return new Response(
        JSON.stringify({ error: 'startsAt and endsAt are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if blocking is allowed (no existing bookings)
    const { data: canBlock } = await client.rpc('can_create_block', {
      p_tenant_id: teacherId,
      p_starts_at: payload.startsAt,
      p_ends_at: payload.endsAt,
    });

    if (!canBlock?.allowed) {
      return new Response(
        JSON.stringify({ 
          error: canBlock?.reason || 'Cannot create block',
          blocking_bookings: canBlock?.blocking_bookings 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: block, error } = await client
      .from('blocks')
      .insert({
        tenant_id: teacherId,
        starts_at: payload.startsAt,
        ends_at: payload.endsAt,
        title: payload.title || null,
        reason: payload.reason || null,
        is_recurring: payload.isRecurring || false,
        recurrence_rule: payload.recurrenceRule || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Create block error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create block' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await client.from('audit_logs').insert({
      tenant_id: teacherId,
      entity_type: 'block',
      entity_id: block.id,
      action: 'block_created',
      actor_id: profileId,
      actor_type: 'teacher',
      new_values: block,
    });

    return new Response(
      JSON.stringify({ success: true, block }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // DELETE - Remove block
  if (req.method === 'DELETE') {
    const blockId = url.searchParams.get('id');
    if (!blockId) {
      return new Response(
        JSON.stringify({ error: 'Block ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await client
      .from('blocks')
      .delete()
      .eq('id', blockId)
      .eq('tenant_id', teacherId);

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete block' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// AVAILABILITY - Get available slots
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAvailability(
  req: Request,
  client: any,
  teacherId: string,
  url: URL
) {
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const fromDate = url.searchParams.get('from');
  const toDate = url.searchParams.get('to');
  const timezone = url.searchParams.get('tz') || 'UTC';

  if (!fromDate || !toDate) {
    return new Response(
      JSON.stringify({ error: 'from and to dates are required (YYYY-MM-DD)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: slots, error } = await client.rpc('get_availability_slots', {
    p_tenant_id: teacherId,
    p_from_date: fromDate,
    p_to_date: toDate,
    p_timezone: timezone,
  });

  if (error) {
    console.error('Get availability error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch availability' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ slots, timezone }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// CONFLICTS - Check for conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleConflicts(
  req: Request,
  client: any,
  teacherId: string
) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { startsAt, endsAt, excludeClassId, excludeBlockId } = await req.json();

  if (!startsAt || !endsAt) {
    return new Response(
      JSON.stringify({ error: 'startsAt and endsAt are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: conflicts, error } = await client.rpc('detect_schedule_conflicts', {
    p_tenant_id: teacherId,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_exclude_class_id: excludeClassId || null,
    p_exclude_block_id: excludeBlockId || null,
  });

  if (error) {
    console.error('Conflict check error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check conflicts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ 
      has_conflicts: conflicts && conflicts.length > 0,
      conflicts: conflicts || [] 
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
