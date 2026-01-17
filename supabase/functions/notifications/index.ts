import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

interface NotificationPayload {
  event_id?: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  payload: Record<string, unknown>;
  recipient_email?: string;
  recipient_name?: string;
  tenant_id?: string;
}

interface JobPayload {
  job_id: string;
  type: string;
  payload: NotificationPayload;
  tenant_id?: string;
}

function replaceVariables(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] ?? match);
  });
}

async function sendEmail(to: string, toName: string, subject: string, body: string): Promise<{ success: boolean; error?: string }> {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const resend = new Resend(resendApiKey);
    const htmlBody = body.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const { error } = await resend.emails.send({
      from: 'Pole Agenda <noreply@resend.dev>',
      to: [to],
      subject,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #7c3aed;">Pole Agenda</h2>
        <p>Olá ${toName},</p>
        ${htmlBody}
        <hr style="margin-top: 20px; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">Email automático.</p>
      </div>`,
    });

    if (error) return { success: false, error: (error as Error).message };
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function processNotificationJob(supabaseClient: ReturnType<typeof createClient>, job: JobPayload): Promise<{ success: boolean; error?: string }> {
  const { payload, tenant_id } = job;
  const eventType = payload.event_type;

  console.log(`Processing notification for event: ${eventType}`);

  const recipientEmail = payload.recipient_email;
  const recipientName = payload.recipient_name || 'Usuário';

  if (!recipientEmail) {
    console.warn('No recipient email');
    return { success: true };
  }

  // Get template
  const { data: template } = await supabaseClient
    .from('notification_templates')
    .select('subject, body_template')
    .eq('event_type', eventType)
    .eq('channel', 'email')
    .eq('is_active', true)
    .or(`tenant_id.eq.${tenant_id},tenant_id.is.null`)
    .order('tenant_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .single();

  if (!template) {
    console.warn(`No template for: ${eventType}`);
    return { success: true };
  }

  const variables = { ...payload.payload, recipient_name: recipientName };
  const subject = replaceVariables(String(template.subject || ''), variables);
  const body = replaceVariables(String(template.body_template), variables);

  return await sendEmail(recipientEmail, recipientName, subject, body);
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'process-job' && req.method === 'POST') {
      const job = await req.json() as JobPayload;
      const result = await processNotificationJob(supabase, job);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send' && req.method === 'POST') {
      const body = await req.json();
      const job: JobPayload = {
        job_id: 'direct',
        type: 'send_notifications',
        payload: {
          event_type: body.event_type,
          payload: body.payload || {},
          recipient_email: body.recipient_email,
          recipient_name: body.recipient_name || 'Usuário',
        },
        tenant_id: body.tenant_id,
      };
      const result = await processNotificationJob(supabase, job);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'emit' && req.method === 'POST') {
      const body = await req.json();
      const { data, error } = await supabase.rpc('emit_event', {
        p_tenant_id: body.tenant_id,
        p_event_type: body.event_type,
        p_entity_type: body.entity_type,
        p_entity_id: body.entity_id,
        p_payload: body.payload || {},
        p_actor_id: body.actor_id,
        p_actor_type: body.actor_type,
      });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: true, event_id: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'schedule-reminders' && req.method === 'POST') {
      const { data, error } = await supabase.rpc('schedule_reminders');
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: true, scheduled_count: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
