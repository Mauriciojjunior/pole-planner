import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple XOR-based obfuscation for sensitive data (use proper encryption in production)
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

interface OnboardingPayload {
  name: string;
  email: string;
  slug: string;
  bio?: string;
  phone?: string;
  address?: string;
  specialties?: string[];
  timezone?: string;
  priceCents?: number;
  currency?: string;
  isPricePublic?: boolean;
  isPhonePublic?: boolean;
}

const VALID_TIMEZONES = [
  'America/Sao_Paulo', 'America/New_York', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'UTC'
];

function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign
  return /^[\d\s\-\(\)\+]+$/.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY') || supabaseServiceKey.slice(0, 32);

  try {
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    // Optional auth - for logged-in user onboarding
    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData } = await supabase.auth.getUser(token);
      userId = claimsData?.user?.id || null;
    }

    const payload: OnboardingPayload = await req.json();
    const errors: string[] = [];

    // Validation
    if (!payload.name || payload.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    if (!payload.email || !validateEmail(payload.email)) {
      errors.push('Valid email is required');
    }
    if (!payload.slug || !validateSlug(payload.slug)) {
      errors.push('Slug must be 3-50 lowercase letters, numbers, and hyphens');
    }
    if (payload.phone && !validatePhone(payload.phone)) {
      errors.push('Invalid phone number format');
    }
    if (payload.timezone && !VALID_TIMEZONES.includes(payload.timezone)) {
      errors.push('Invalid timezone');
    }
    if (payload.priceCents !== undefined && (payload.priceCents < 0 || payload.priceCents > 100000000)) {
      errors.push('Price must be between 0 and 1,000,000.00');
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if slug is already taken
    const { data: existingTeacher } = await serviceClient
      .from('teachers')
      .select('id')
      .eq('slug', payload.slug)
      .single();

    if (existingTeacher) {
      return new Response(
        JSON.stringify({ error: 'This URL slug is already taken' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is already registered
    const { data: existingEmail } = await serviceClient
      .from('teachers')
      .select('id')
      .eq('email', payload.email)
      .single();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'Email is already registered' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt sensitive fields
    const phoneEncrypted = payload.phone ? encryptField(payload.phone, encryptionKey) : null;
    const addressEncrypted = payload.address ? encryptField(payload.address, encryptionKey) : null;

    // Create teacher record
    const { data: teacher, error: insertError } = await serviceClient
      .from('teachers')
      .insert({
        name: payload.name.trim(),
        email: payload.email.toLowerCase().trim(),
        slug: payload.slug.toLowerCase(),
        bio: payload.bio?.trim() || null,
        phone: payload.isPhonePublic ? payload.phone : null, // Public phone if visible
        phone_encrypted: phoneEncrypted,
        address_encrypted: addressEncrypted,
        specialties: payload.specialties || [],
        timezone: payload.timezone || 'America/Sao_Paulo',
        price_cents: payload.priceCents || null,
        currency: payload.currency || 'BRL',
        is_price_public: payload.isPricePublic || false,
        is_phone_public: payload.isPhonePublic || false,
        approval_status: 'pending',
        is_active: false, // Not active until approved
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create teacher:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create teacher profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user is logged in, link their profile to this teacher
    if (userId) {
      const { data: profile } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('external_auth_id', userId)
        .single();

      if (profile) {
        // Add teacher role
        await serviceClient.from('user_roles').insert({
          profile_id: profile.id,
          tenant_id: teacher.id,
          role: 'teacher',
        });
      }
    }

    // Log audit entry
    await serviceClient.from('audit_logs').insert({
      tenant_id: teacher.id,
      entity_type: 'teacher',
      entity_id: teacher.id,
      action: 'teacher_signup',
      new_values: { name: teacher.name, email: teacher.email, slug: teacher.slug },
    });

    console.log(`New teacher signup: ${teacher.email} (${teacher.id})`);

    return new Response(
      JSON.stringify({
        success: true,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          slug: teacher.slug,
          email: teacher.email,
          approval_status: teacher.approval_status,
        },
        message: 'Teacher profile created. Pending admin approval.',
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Teacher onboarding error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
