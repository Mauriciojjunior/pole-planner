import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Job {
  id: string;
  tenant_id: string | null;
  type: string;
  payload: Record<string, unknown>;
  status: string;
  attempts: number;
  max_attempts: number;
}

function getNextRetryTime(attempts: number): Date {
  const delays = [60, 300, 900];
  return new Date(Date.now() + delays[Math.min(attempts - 1, delays.length - 1)] * 1000);
}

async function processJob(job: Job): Promise<{ success: boolean; error?: string }> {
  console.log(`Processing job ${job.id} of type ${job.type}`);

  try {
    if (job.type === 'send_notifications') {
      const response = await fetch(`${supabaseUrl}/functions/v1/notifications?action=process-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ job_id: job.id, type: job.type, payload: job.payload, tenant_id: job.tenant_id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed');
      return { success: true };
    }

    if (job.type === 'deliver_webhook') {
      const response = await fetch(`${supabaseUrl}/functions/v1/webhooks?action=deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify(job.payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed');
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function processJobs(supabaseClient: ReturnType<typeof createClient>, batchSize: number = 10) {
  const results = { processed: 0, failed: 0 };

  const { data: jobs } = await supabaseClient
    .from('jobs')
    .select('*')
    .in('status', ['pending', 'failed'])
    .or('scheduled_at.is.null,scheduled_at.lte.now()')
    .lt('attempts', 3)
    .order('priority', { ascending: false })
    .limit(batchSize);

  if (!jobs?.length) return results;

  for (const jobData of jobs) {
    const job = jobData as Job;
    
    await supabaseClient.from('jobs').update({ status: 'processing', started_at: new Date().toISOString(), attempts: job.attempts + 1 }).eq('id', job.id);

    const result = await processJob(job);

    if (result.success) {
      await supabaseClient.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);
      results.processed++;
    } else {
      const isDead = job.attempts + 1 >= job.max_attempts;
      await supabaseClient.from('jobs').update({ status: isDead ? 'dead' : 'failed', error: result.error, scheduled_at: isDead ? null : getNextRetryTime(job.attempts + 1).toISOString() }).eq('id', job.id);
      results.failed++;
    }
  }

  return results;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'process' && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const results = await processJobs(supabase, body.batch_size || 10);
      return new Response(JSON.stringify(results), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'stats' && req.method === 'GET') {
      const { data } = await supabase.from('jobs').select('status').gte('created_at', new Date(Date.now() - 86400000).toISOString());
      const stats = { pending: 0, processing: 0, completed: 0, failed: 0, dead: 0 };
      for (const job of data || []) { const s = job.status as keyof typeof stats; if (s in stats) stats[s]++; }
      return new Response(JSON.stringify({ stats }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
