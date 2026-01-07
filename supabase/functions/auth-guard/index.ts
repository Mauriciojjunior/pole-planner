import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenClaims {
  sub: string;
  email: string;
  role: string;
  exp: number;
  aud: string;
}

interface RoleCheck {
  profileId: string;
  roles: Array<{
    role: 'admin' | 'teacher' | 'student';
    tenantId: string;
  }>;
  tenantContext: {
    tenantId: string | null;
    isApprovedTeacher: boolean;
  } | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'NO_AUTH_HEADER' }),
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
      console.error('JWT validation failed:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Invalid token', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claims = claimsData.claims as unknown as TokenClaims;
    const userId = claims.sub;

    // Create service client for database queries
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch profile by external_auth_id
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, email, name')
      .eq('external_auth_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found', code: 'NO_PROFILE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch roles from database (NOT from JWT!)
    const { data: roles, error: rolesError } = await serviceClient
      .from('user_roles')
      .select('role, tenant_id')
      .eq('profile_id', profile.id);

    if (rolesError) {
      console.error('Roles fetch failed:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch roles', code: 'ROLES_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for role requirements
    const body = await req.json().catch(() => ({}));
    const { requiredRole, tenantId } = body as { 
      requiredRole?: 'admin' | 'teacher' | 'student';
      tenantId?: string;
    };

    const roleCheck: RoleCheck = {
      profileId: profile.id,
      roles: (roles || []).map(r => ({
        role: r.role as 'admin' | 'teacher' | 'student',
        tenantId: r.tenant_id,
      })),
      tenantContext: null,
    };

    // If tenant context is requested, fetch teacher approval status
    if (tenantId) {
      const { data: teacher } = await serviceClient
        .from('teachers')
        .select('id, approval_status')
        .eq('id', tenantId)
        .single();

      roleCheck.tenantContext = {
        tenantId,
        isApprovedTeacher: teacher?.approval_status === 'approved',
      };
    }

    // Validate required role if specified
    if (requiredRole) {
      const hasRequiredRole = roleCheck.roles.some(r => 
        r.role === requiredRole && (tenantId ? r.tenantId === tenantId : true)
      );

      // Admin always has access
      const isAdmin = roleCheck.roles.some(r => r.role === 'admin');

      if (!hasRequiredRole && !isAdmin) {
        console.log(`Access denied: required ${requiredRole}, user has:`, roleCheck.roles);
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient permissions', 
            code: 'FORBIDDEN',
            required: requiredRole,
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return successful auth context
    return new Response(
      JSON.stringify({
        authenticated: true,
        userId,
        profileId: profile.id,
        email: profile.email,
        name: profile.name,
        roles: roleCheck.roles,
        tenantContext: roleCheck.tenantContext,
        tokenExp: claims.exp,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Auth guard error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
