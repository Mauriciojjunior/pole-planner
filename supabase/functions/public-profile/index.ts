import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const teacherId = url.searchParams.get('id');

    if (!slug && !teacherId) {
      return new Response(
        JSON.stringify({ error: 'Slug or teacher ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if request is authenticated
    const authHeader = req.headers.get('Authorization');
    let studentProfileId: string | null = null;
    let isEnrolled = false;

    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabase.auth.getUser(token);
      
      if (userData?.user) {
        const { data: profile } = await serviceClient
          .from('profiles')
          .select('id')
          .eq('external_auth_id', userData.user.id)
          .single();
        
        studentProfileId = profile?.id || null;
      }
    }

    // Build query
    let query = serviceClient
      .from('teachers')
      .select('id, name, slug, bio, avatar_url, specialties, timezone, price_cents, currency, is_price_public, is_phone_public, phone, email, portfolio_url')
      .eq('is_active', true)
      .eq('approval_status', 'approved');

    if (slug) {
      query = query.eq('slug', slug);
    } else {
      query = query.eq('id', teacherId);
    }

    const { data: teacher, error } = await query.single();

    if (error || !teacher) {
      return new Response(
        JSON.stringify({ error: 'Teacher not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if authenticated user is enrolled with this teacher
    if (studentProfileId) {
      const { data: enrollment } = await serviceClient
        .from('students')
        .select('id')
        .eq('profile_id', studentProfileId)
        .eq('tenant_id', teacher.id)
        .eq('is_active', true)
        .single();

      isEnrolled = !!enrollment;
    }

    // Build response based on access level
    const publicProfile: Record<string, unknown> = {
      id: teacher.id,
      name: teacher.name,
      slug: teacher.slug,
      bio: teacher.bio,
      avatar_url: teacher.avatar_url,
      specialties: teacher.specialties,
      timezone: teacher.timezone,
      portfolio_url: teacher.portfolio_url,
    };

    // Add price if public
    if (teacher.is_price_public) {
      publicProfile.price_cents = teacher.price_cents;
      publicProfile.currency = teacher.currency;
    }

    // Add phone if public
    if (teacher.is_phone_public) {
      publicProfile.phone = teacher.phone;
    }

    // For enrolled students, include more details
    if (isEnrolled) {
      publicProfile.email = teacher.email;
      publicProfile.phone = teacher.phone;
      publicProfile.price_cents = teacher.price_cents;
      publicProfile.currency = teacher.currency;
      publicProfile.is_enrolled = true;
    }

    // Get public class types for this teacher
    const { data: classTypes } = await serviceClient
      .from('class_types')
      .select('id, name, description, duration_minutes, max_students, color')
      .eq('tenant_id', teacher.id)
      .eq('is_active', true)
      .eq('is_public', true);

    return new Response(
      JSON.stringify({ 
        teacher: publicProfile,
        classTypes: classTypes || [],
        access_level: isEnrolled ? 'enrolled' : (studentProfileId ? 'authenticated' : 'public'),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Public profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
