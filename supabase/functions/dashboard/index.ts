import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthContext {
  userId: string
  profileId: string
  tenantId: string | null
  role: string
}

async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  try {
    const response = await fetch(
      `https://zvvvfitrolqeyrfszfcv.supabase.co/functions/v1/auth-guard`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ action: 'validate' }),
      }
    )

    if (!response.ok) return null
    const data = await response.json()
    return data.context || null
  } catch {
    return null
  }
}

// Teacher Dashboard Handlers
async function getTeacherSummary(client: any, tenantId: string, startDate: string, endDate: string) {
  const { data, error } = await client.rpc('get_teacher_dashboard_summary', {
    p_tenant_id: tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) throw error
  return data?.[0] || null
}

async function getTeacherClassStats(client: any, tenantId: string, startDate: string, endDate: string, groupBy: string) {
  const { data, error } = await client.rpc('get_teacher_classes_stats', {
    p_tenant_id: tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_group_by: groupBy,
  })

  if (error) throw error
  return data || []
}

async function getTeacherStudentStats(client: any, tenantId: string, startDate: string | null, endDate: string | null, limit: number) {
  const { data, error } = await client.rpc('get_teacher_student_stats', {
    p_tenant_id: tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_limit: limit,
  })

  if (error) throw error
  return data || []
}

async function getTeacherExportData(client: any, tenantId: string, startDate: string, endDate: string, exportType: string) {
  const { data, error } = await client.rpc('get_teacher_export_data', {
    p_tenant_id: tenantId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_export_type: exportType,
  })

  if (error) throw error
  return data?.map((row: any) => row.data) || []
}

// Admin Dashboard Handlers
async function getAdminPlatformStats(client: any, startDate: string, endDate: string) {
  const { data, error } = await client.rpc('get_admin_platform_stats', {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) throw error
  return data?.[0] || null
}

async function getAdminConversionFunnel(client: any, startDate: string, endDate: string) {
  const { data, error } = await client.rpc('get_admin_conversion_funnel', {
    p_start_date: startDate,
    p_end_date: endDate,
  })

  if (error) throw error
  return data || []
}

async function getAdminSubscriptionStats(client: any) {
  const { data, error } = await client.rpc('get_admin_subscription_stats')

  if (error) throw error
  return data || []
}

async function getAdminUsageOverTime(client: any, startDate: string, endDate: string, groupBy: string) {
  const { data, error } = await client.rpc('get_admin_usage_over_time', {
    p_start_date: startDate,
    p_end_date: endDate,
    p_group_by: groupBy,
  })

  if (error) throw error
  return data || []
}

// CSV Export Helper
function generateCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) return ''
  
  const keys = headers || Object.keys(data[0])
  const csvRows = [keys.join(',')]
  
  for (const row of data) {
    const values = keys.map(key => {
      const val = row[key]
      if (val === null || val === undefined) return ''
      const str = String(val).replace(/"/g, '""')
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    const endpoint = pathParts[1] || '' // teacher or admin
    const action = url.searchParams.get('action') || 'summary'
    
    // Query params
    const startDate = url.searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = url.searchParams.get('end_date') || new Date().toISOString().split('T')[0]
    const groupBy = url.searchParams.get('group_by') || 'day'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const exportType = url.searchParams.get('export_type') || 'bookings'
    const format = url.searchParams.get('format') || 'json' // json or csv

    // Auth
    const authContext = await getAuthContext(req)
    if (!authContext) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const client = createClient(supabaseUrl, supabaseServiceKey)

    let result: any

    if (endpoint === 'teacher') {
      if (!authContext.tenantId) {
        return new Response(
          JSON.stringify({ error: 'Tenant não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      switch (action) {
        case 'summary':
          result = await getTeacherSummary(client, authContext.tenantId, startDate, endDate)
          break
        case 'classes':
          result = await getTeacherClassStats(client, authContext.tenantId, startDate, endDate, groupBy)
          break
        case 'students':
          result = await getTeacherStudentStats(client, authContext.tenantId, startDate, endDate, limit)
          break
        case 'export':
          result = await getTeacherExportData(client, authContext.tenantId, startDate, endDate, exportType)
          
          if (format === 'csv') {
            const csv = generateCSV(result)
            return new Response(csv, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${exportType}_${startDate}_${endDate}.csv"`,
              },
            })
          }
          break
        default:
          return new Response(
            JSON.stringify({ error: 'Ação inválida' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    } else if (endpoint === 'admin') {
      // Check admin role
      if (authContext.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      switch (action) {
        case 'summary':
          result = await getAdminPlatformStats(client, startDate, endDate)
          break
        case 'funnel':
          result = await getAdminConversionFunnel(client, startDate, endDate)
          break
        case 'subscriptions':
          result = await getAdminSubscriptionStats(client)
          break
        case 'usage':
          result = await getAdminUsageOverTime(client, startDate, endDate, groupBy)
          break
        default:
          return new Response(
            JSON.stringify({ error: 'Ação inválida' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Endpoint inválido. Use /teacher ou /admin' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Dashboard error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
