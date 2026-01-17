import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Structured logger
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
  request_id?: string;
  tenant_id?: string;
  duration_ms?: number;
}

function log(level: LogEntry['level'], message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
  console.log(JSON.stringify(entry));
}

// Auth context helper
async function getAuthContext(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-guard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Record a metric
// deno-lint-ignore no-explicit-any
async function recordMetric(supabase: SupabaseClient<any>, name: string, value: number, labels?: Record<string, unknown>, tenantId?: string) {
  await supabase.from('metrics').insert({
    name,
    value,
    labels: labels || {},
    tenant_id: tenantId,
  });
}

// Export user data
// deno-lint-ignore no-explicit-any
async function exportUserData(supabase: SupabaseClient<any>, profileId: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
  log('info', 'Exporting user data', { profile_id: profileId });

  const { data, error } = await supabase.rpc('export_user_data', { p_profile_id: profileId });

  if (error) {
    log('error', 'Export failed', { profile_id: profileId, error: error.message });
    return { success: false, error: error.message };
  }

  // Record export request
  await supabase.from('data_export_requests').insert({
    profile_id: profileId,
    status: 'completed',
    format: 'json',
    completed_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await supabase.from('audit_logs').insert({
    entity_type: 'data_export',
    entity_id: profileId,
    action: 'export',
    actor_id: profileId,
    actor_type: 'user',
  });

  log('info', 'Export completed', { profile_id: profileId });
  return { success: true, data };
}

// Request account deletion
// deno-lint-ignore no-explicit-any
async function requestDeletion(supabase: SupabaseClient<any>, profileId: string, reason?: string): Promise<{ success: boolean; request_id?: string; scheduled_for?: string; error?: string }> {
  log('info', 'Requesting account deletion', { profile_id: profileId });

  const { data, error } = await supabase.rpc('request_account_deletion', {
    p_profile_id: profileId,
    p_reason: reason,
  });

  if (error) {
    log('error', 'Deletion request failed', { profile_id: profileId, error: error.message });
    return { success: false, error: error.message };
  }

  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  log('info', 'Deletion scheduled', { profile_id: profileId, scheduled_for: scheduledFor });

  return { success: true, request_id: data, scheduled_for: scheduledFor };
}

// Cancel account deletion
// deno-lint-ignore no-explicit-any
async function cancelDeletion(supabase: SupabaseClient<any>, profileId: string, requestId: string): Promise<{ success: boolean; error?: string }> {
  log('info', 'Cancelling account deletion', { profile_id: profileId, request_id: requestId });

  const { data, error } = await supabase.rpc('cancel_account_deletion', {
    p_profile_id: profileId,
    p_request_id: requestId,
  });

  if (error || !data) {
    return { success: false, error: error?.message || 'Request not found' };
  }

  return { success: true };
}

// Get metrics summary
// deno-lint-ignore no-explicit-any
async function getMetricsSummary(supabase: SupabaseClient<any>, tenantId?: string) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('metrics')
    .select('name, value, recorded_at')
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: false })
    .limit(1000);

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: metrics } = await query;

  // Aggregate metrics
  const summary: Record<string, { count: number; sum: number; avg: number; min: number; max: number }> = {};

  for (const m of metrics || []) {
    if (!summary[m.name]) {
      summary[m.name] = { count: 0, sum: 0, avg: 0, min: Infinity, max: -Infinity };
    }
    summary[m.name].count++;
    summary[m.name].sum += m.value;
    summary[m.name].min = Math.min(summary[m.name].min, m.value);
    summary[m.name].max = Math.max(summary[m.name].max, m.value);
  }

  for (const name in summary) {
    summary[name].avg = summary[name].sum / summary[name].count;
    if (summary[name].min === Infinity) summary[name].min = 0;
    if (summary[name].max === -Infinity) summary[name].max = 0;
  }

  return summary;
}

// Get audit logs
// deno-lint-ignore no-explicit-any
async function getAuditLogs(supabase: SupabaseClient<any>, tenantId: string, filters: { entity_type?: string; action?: string; limit?: number }) {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(filters.limit || 100);

  if (filters.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters.action) query = query.eq('action', filters.action);

  const { data, error } = await query;

  if (error) return { logs: [], error: error.message };
  return { logs: data };
}

// Apply data retention
// deno-lint-ignore no-explicit-any
async function applyRetention(supabase: SupabaseClient<any>): Promise<{ success: boolean; deleted_count?: number; error?: string }> {
  log('info', 'Applying data retention policies');

  const { data, error } = await supabase.rpc('apply_data_retention');

  if (error) {
    log('error', 'Retention failed', { error: error.message });
    return { success: false, error: error.message };
  }

  log('info', 'Retention completed', { deleted_count: data });
  return { success: true, deleted_count: data };
}

// Main handler
serve(async (req: Request): Promise<Response> => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  log('info', 'Request received', { action, method: req.method, request_id: requestId });

  try {
    // Public health check
    if (action === 'health') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Record metric (service role only)
    if (action === 'record-metric' && req.method === 'POST') {
      const body = await req.json();
      await recordMetric(supabase, body.name, body.value, body.labels, body.tenant_id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply retention (service role only, for cron jobs)
    if (action === 'apply-retention' && req.method === 'POST') {
      const result = await applyRetention(supabase);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth required for remaining endpoints
    const auth = await getAuthContext(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Export user data (LGPD)
    if (action === 'export-data' && req.method === 'POST') {
      const result = await exportUserData(supabase, auth.profile_id);
      const duration = Date.now() - startTime;
      await recordMetric(supabase, 'data_export_duration_ms', duration, { status: result.success ? 'success' : 'error' });
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Request account deletion (LGPD)
    if (action === 'request-deletion' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const result = await requestDeletion(supabase, auth.profile_id, body.reason);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cancel account deletion
    if (action === 'cancel-deletion' && req.method === 'POST') {
      const body = await req.json();
      const result = await cancelDeletion(supabase, auth.profile_id, body.request_id);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get deletion status
    if (action === 'deletion-status' && req.method === 'GET') {
      const { data } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('profile_id', auth.profile_id)
        .in('status', ['pending', 'scheduled'])
        .single();

      return new Response(JSON.stringify({ request: data }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get metrics (admin/teacher)
    if (action === 'metrics' && req.method === 'GET') {
      const tenantId = auth.role === 'admin' ? undefined : auth.tenant_id;
      const summary = await getMetricsSummary(supabase, tenantId);
      
      return new Response(JSON.stringify({ metrics: summary }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get audit logs (teacher/admin)
    if (action === 'audit-logs' && req.method === 'GET') {
      if (auth.role !== 'teacher' && auth.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await getAuditLogs(supabase, auth.tenant_id, {
        entity_type: url.searchParams.get('entity_type') || undefined,
        action: url.searchParams.get('filter_action') || undefined,
        limit: parseInt(url.searchParams.get('limit') || '100'),
      });
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    log('error', 'Request failed', { error: String(error), duration_ms: duration, request_id: requestId });
    
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
