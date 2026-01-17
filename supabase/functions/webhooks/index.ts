import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface WebhookDeliveryJob {
  job_id: string;
  webhook_subscription_id: string;
  event_id: string;
  url: string;
  secret?: string;
  headers?: Record<string, string>;
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hashHex}`;
}

async function deliverWebhook(supabaseClient: ReturnType<typeof createClient>, job: WebhookDeliveryJob): Promise<{ success: boolean; error?: string }> {
  console.log(`Delivering webhook to ${job.url}`);

  try {
    const { data: event } = await supabaseClient.from('events').select('*').eq('id', job.event_id).single();
    if (!event) return { success: false, error: 'Event not found' };

    const payload = { id: event.id, type: event.event_type, created_at: event.created_at, data: event.payload };
    const payloadString = JSON.stringify(payload);

    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Webhook-Event': String(event.event_type), ...job.headers };
    if (job.secret) headers['X-Webhook-Signature'] = await generateSignature(payloadString, job.secret);

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30000);

    const response = await fetch(job.url, { method: 'POST', headers, body: payloadString, signal: controller.signal });
    
    await supabaseClient.from('webhook_deliveries').update({
      response_status: response.status,
      status: response.ok ? 'delivered' : 'failed',
      delivered_at: response.ok ? new Date().toISOString() : null,
    }).eq('webhook_subscription_id', job.webhook_subscription_id).eq('event_id', job.event_id);

    return response.ok ? { success: true } : { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  try {
    if (action === 'deliver' && req.method === 'POST') {
      const job = await req.json() as WebhookDeliveryJob;
      const result = await deliverWebhook(supabase, job);
      return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
