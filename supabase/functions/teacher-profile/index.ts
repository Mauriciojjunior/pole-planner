import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function encryptField(value: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const valueBytes = new TextEncoder().encode(value);
  const encrypted = new Uint8Array(valueBytes.length);
  
  for (let i = 0; i < valueBytes.length; i++) {
    encrypted[i] = valueBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

function decryptField(encrypted: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const encryptedBytes = new Uint8Array(
    atob(encrypted).split('').map(c => c.charCodeAt(0))
  );
  const decrypted = new Uint8Array(encryptedBytes.length);
  
  for (let i = 0; i < encryptedBytes.length; i++) {
    decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return new TextDecoder().decode(decrypted);
}

interface ProfileUpdatePayload {
  name?: string;
  bio?: string;
  phone?: string;
  address?: string;
  specialties?: string[];
  timezone?: string;
  priceCents?: number;
  currency?: string;
  isPricePublic?: boolean;
  isPhonePublic?: boolean;
  avatarUrl?: string;
  portfolioUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || supabaseServiceKey.slice(0, 32);

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

    // Get user's profile
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

    // Get teacher role for this profile
    const { data: teacherRole } = await serviceClient
      .from('user_roles')
      .select('tenant_id')
      .eq('profile_id', profile.id)
      .eq('role', 'teacher')
      .single();

    if (!teacherRole) {
      return new Response(
        JSON.stringify({ error: 'Not a teacher' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teacherId = teacherRole.tenant_id;

    // Handle GET - fetch profile
    if (req.method === 'GET') {
      const { data: teacher } = await serviceClient
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (!teacher) {
        return new Response(
          JSON.stringify({ error: 'Teacher not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Decrypt sensitive fields for the teacher themselves
      const response = {
        ...teacher,
        phone_decrypted: teacher.phone_encrypted 
          ? decryptField(teacher.phone_encrypted, encryptionKey) 
          : teacher.phone,
        address_decrypted: teacher.address_encrypted 
          ? decryptField(teacher.address_encrypted, encryptionKey) 
          : null,
      };

      // Get document status
      const { data: documents } = await serviceClient
        .from('teacher_documents')
        .select('id, type, status, file_name, created_at')
        .eq('tenant_id', teacherId)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ teacher: response, documents: documents || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle PUT/PATCH - update profile
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const payload: ProfileUpdatePayload = await req.json();
      const updates: Record<string, unknown> = {};

      if (payload.name !== undefined) {
        if (payload.name.trim().length < 2) {
          return new Response(
            JSON.stringify({ error: 'Name must be at least 2 characters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        updates.name = payload.name.trim();
      }

      if (payload.bio !== undefined) updates.bio = payload.bio?.trim() || null;
      if (payload.specialties !== undefined) updates.specialties = payload.specialties;
      if (payload.timezone !== undefined) updates.timezone = payload.timezone;
      if (payload.priceCents !== undefined) updates.price_cents = payload.priceCents;
      if (payload.currency !== undefined) updates.currency = payload.currency;
      if (payload.isPricePublic !== undefined) updates.is_price_public = payload.isPricePublic;
      if (payload.isPhonePublic !== undefined) updates.is_phone_public = payload.isPhonePublic;
      if (payload.avatarUrl !== undefined) updates.avatar_url = payload.avatarUrl;
      if (payload.portfolioUrl !== undefined) updates.portfolio_url = payload.portfolioUrl;

      // Handle phone update
      if (payload.phone !== undefined) {
        updates.phone_encrypted = payload.phone ? encryptField(payload.phone, encryptionKey) : null;
        updates.phone = payload.isPhonePublic ? payload.phone : null;
      }

      // Handle address update
      if (payload.address !== undefined) {
        updates.address_encrypted = payload.address ? encryptField(payload.address, encryptionKey) : null;
      }

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid fields to update' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current values for audit
      const { data: currentTeacher } = await serviceClient
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      const { data: updatedTeacher, error: updateError } = await serviceClient
        .from('teachers')
        .update(updates)
        .eq('id', teacherId)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update teacher:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log audit entry
      await serviceClient.from('audit_logs').insert({
        tenant_id: teacherId,
        entity_type: 'teacher',
        entity_id: teacherId,
        action: 'profile_updated',
        actor_id: profile.id,
        actor_type: 'teacher',
        old_values: currentTeacher,
        new_values: updates,
      });

      return new Response(
        JSON.stringify({ success: true, teacher: updatedTeacher }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Teacher profile error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
