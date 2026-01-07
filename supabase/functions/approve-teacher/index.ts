import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = (claimsData.claims as { sub: string }).sub;

    // Service client for admin operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get profile and verify admin role
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('external_auth_id', userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await serviceClient
      .from('user_roles')
      .select('id')
      .eq('profile_id', profile.id)
      .eq('role', 'admin')
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { teacherId, action } = await req.json() as {
      teacherId: string;
      action: 'approve' | 'reject';
    };

    if (!teacherId || !['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: teacherId and action (approve/reject) required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update teacher approval status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await serviceClient
      .from('teachers')
      .update({ 
        approval_status: newStatus,
        is_active: action === 'approve',
      })
      .eq('id', teacherId);

    if (updateError) {
      console.error('Failed to update teacher:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update teacher status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit entry
    await serviceClient.from('audit_logs').insert({
      tenant_id: teacherId,
      entity_type: 'teacher',
      entity_id: teacherId,
      action: `teacher_${action}d`,
      actor_id: profile.id,
      actor_type: 'admin',
      new_values: { approval_status: newStatus },
    });

    // Create notification for teacher
    const { data: teacher } = await serviceClient
      .from('teachers')
      .select('email, name')
      .eq('id', teacherId)
      .single();

    if (teacher) {
      // Find teacher's profile
      const { data: teacherProfile } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('email', teacher.email)
        .single();

      if (teacherProfile) {
        await serviceClient.from('notifications').insert({
          tenant_id: teacherId,
          profile_id: teacherProfile.id,
          type: action === 'approve' ? 'account_approved' : 'account_rejected',
          title: action === 'approve' 
            ? 'Your account has been approved!' 
            : 'Account application update',
          body: action === 'approve'
            ? 'Welcome! You can now access all teacher features.'
            : 'Your teacher account application was not approved. Please contact support for more information.',
          channel: 'in_app',
        });
      }
    }

    console.log(`Teacher ${teacherId} ${action}d by admin ${profile.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        teacherId, 
        status: newStatus,
        message: `Teacher ${action}d successfully`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Approve teacher error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
