import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AuthContext {
  profileId: string;
  tenantId: string | null;
  role: string | null;
}

async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Call auth-guard to validate token
  const response = await fetch(`${SUPABASE_URL}/functions/v1/auth-guard`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) return null;
  
  const data = await response.json();
  return {
    profileId: data.profile?.id,
    tenantId: data.roles?.[0]?.tenant_id || null,
    role: data.roles?.[0]?.role || null,
  };
}

// ============ PLAN HANDLERS ============

async function listPlans(
  client: any,
  tenantId: string,
  publicOnly: boolean = false
): Promise<Response> {
  let query = client
    .from("plans")
    .select("id, name, description, price_cents, currency, duration_days, classes_per_month, plan_type, trial_days, features, sort_order")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Format prices for display
  const formattedPlans = data.map((plan: any) => ({
    ...plan,
    price_formatted: new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: plan.currency || "BRL",
    }).format(plan.price_cents / 100),
  }));

  return new Response(JSON.stringify({ plans: formattedPlans }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createPlan(
  client: any,
  tenantId: string,
  body: any
): Promise<Response> {
  const {
    name,
    description,
    price_cents,
    currency = "BRL",
    duration_days,
    classes_per_month,
    plan_type = "monthly",
    trial_days = 0,
    features = [],
    sort_order = 0,
  } = body;

  // Calculate duration based on plan_type if not provided
  let calculatedDuration = duration_days;
  if (!calculatedDuration) {
    switch (plan_type) {
      case "monthly": calculatedDuration = 30; break;
      case "quarterly": calculatedDuration = 90; break;
      case "semiannual": calculatedDuration = 180; break;
      default: calculatedDuration = 30;
    }
  }

  const { data, error } = await client
    .from("plans")
    .insert({
      tenant_id: tenantId,
      name,
      description,
      price_cents,
      currency,
      duration_days: calculatedDuration,
      classes_per_month,
      plan_type,
      trial_days,
      features,
      sort_order,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ plan: data }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updatePlan(
  client: any,
  tenantId: string,
  planId: string,
  body: any
): Promise<Response> {
  const updateData: any = {};
  
  const allowedFields = [
    "name", "description", "price_cents", "currency", "duration_days",
    "classes_per_month", "plan_type", "trial_days", "features", "sort_order", "is_active"
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await client
    .from("plans")
    .update(updateData)
    .eq("id", planId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ plan: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============ SUBSCRIPTION HANDLERS ============

async function getStudentSubscription(
  client: any,
  tenantId: string,
  studentId: string
): Promise<Response> {
  const { data, error } = await client.rpc("get_student_subscription", {
    p_student_id: studentId,
    p_tenant_id: tenantId,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createSubscription(
  client: any,
  tenantId: string,
  body: any
): Promise<Response> {
  const { student_id, plan_id, start_trial = false } = body;

  const { data, error } = await client.rpc("create_subscription", {
    p_student_id: student_id,
    p_plan_id: plan_id,
    p_tenant_id: tenantId,
    p_start_trial: start_trial,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data.success) {
    return new Response(JSON.stringify({ error: data.error }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function cancelSubscription(
  client: any,
  tenantId: string,
  subscriptionId: string,
  body: any
): Promise<Response> {
  const { reason, immediate = false } = body;

  const { data, error } = await client.rpc("cancel_subscription", {
    p_subscription_id: subscriptionId,
    p_tenant_id: tenantId,
    p_reason: reason,
    p_immediate: immediate,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data.success) {
    return new Response(JSON.stringify({ error: data.error }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function renewSubscription(
  client: any,
  tenantId: string,
  subscriptionId: string
): Promise<Response> {
  const { data, error } = await client.rpc("renew_subscription", {
    p_subscription_id: subscriptionId,
    p_tenant_id: tenantId,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data.success) {
    return new Response(JSON.stringify({ error: data.error }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function listSubscriptions(
  client: any,
  tenantId: string,
  filters: { status?: string; student_id?: string }
): Promise<Response> {
  let query = client
    .from("subscriptions")
    .select(`
      id, status, starts_at, ends_at, is_trial, trial_ends_at,
      classes_remaining, auto_renew, payment_method, cancelled_at,
      student:students!inner(id, name, email),
      plan:plans!inner(id, name, price_cents, currency, plan_type)
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.student_id) {
    query = query.eq("student_id", filters.student_id);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ subscriptions: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function updateSubscriptionStatus(
  client: any,
  tenantId: string,
  subscriptionId: string,
  body: any
): Promise<Response> {
  const { status, classes_remaining } = body;

  const updateData: any = { updated_at: new Date().toISOString() };
  
  if (status) updateData.status = status;
  if (classes_remaining !== undefined) updateData.classes_remaining = classes_remaining;

  const { data, error } = await client
    .from("subscriptions")
    .update(updateData)
    .eq("id", subscriptionId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ subscription: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============ WHATSAPP SALES HANDLERS ============

async function getWhatsAppLink(
  client: any,
  tenantId: string,
  planId: string,
  studentName?: string
): Promise<Response> {
  const { data, error } = await client.rpc("get_whatsapp_sales_link", {
    p_tenant_id: tenantId,
    p_plan_id: planId,
    p_student_name: studentName || null,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!data.success) {
    return new Response(JSON.stringify({ error: data.error }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============ FEATURE GATING ============

async function checkFeatureAccess(
  client: any,
  tenantId: string,
  studentId: string,
  feature: string
): Promise<Response> {
  // Get student subscription
  const { data: subscription, error } = await client.rpc("get_student_subscription", {
    p_student_id: studentId,
    p_tenant_id: tenantId,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!subscription.has_subscription) {
    return new Response(JSON.stringify({ 
      has_access: false, 
      reason: "NO_SUBSCRIPTION" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if subscription is active
  if (subscription.status !== "active") {
    return new Response(JSON.stringify({ 
      has_access: false, 
      reason: "SUBSCRIPTION_" + subscription.status.toUpperCase() 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if feature is in plan features
  const features = subscription.features || [];
  const hasFeature = features.includes(feature) || features.includes("*");

  // Check classes remaining if feature requires booking
  if (feature === "booking" && subscription.classes_remaining !== null) {
    if (subscription.classes_remaining <= 0) {
      return new Response(JSON.stringify({ 
        has_access: false, 
        reason: "NO_CLASSES_REMAINING" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ 
    has_access: hasFeature || features.length === 0, // Allow if no feature restrictions
    subscription_id: subscription.subscription_id,
    classes_remaining: subscription.classes_remaining,
    ends_at: subscription.ends_at,
    is_trial: subscription.is_trial,
  }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============ MAIN HANDLER ============

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const endpoint = pathParts[1] || "";
  const resourceId = pathParts[2] || "";
  const action = pathParts[3] || "";

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Public endpoints (no auth required)
    if (endpoint === "public-plans" && req.method === "GET") {
      const tenantId = url.searchParams.get("tenant_id");
      if (!tenantId) {
        return new Response(JSON.stringify({ error: "tenant_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return listPlans(client, tenantId, true);
    }

    if (endpoint === "whatsapp-link" && req.method === "GET") {
      const tenantId = url.searchParams.get("tenant_id");
      const planId = url.searchParams.get("plan_id");
      const studentName = url.searchParams.get("student_name");
      
      if (!tenantId || !planId) {
        return new Response(JSON.stringify({ error: "tenant_id and plan_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return getWhatsAppLink(client, tenantId, planId, studentName || undefined);
    }

    // Authenticated endpoints
    const auth = await getAuthContext(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method !== "GET" ? await req.json().catch(() => ({})) : {};
    const tenantId = auth.tenantId || body.tenant_id;

    if (!tenantId) {
      return new Response(JSON.stringify({ error: "Tenant context required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== PLAN ROUTES =====
    if (endpoint === "plans") {
      if (req.method === "GET") {
        return listPlans(client, tenantId);
      }
      if (req.method === "POST" && (auth.role === "teacher" || auth.role === "admin")) {
        return createPlan(client, tenantId, body);
      }
      if (req.method === "PUT" && resourceId && (auth.role === "teacher" || auth.role === "admin")) {
        return updatePlan(client, tenantId, resourceId, body);
      }
    }

    // ===== SUBSCRIPTION ROUTES =====
    if (endpoint === "subscriptions") {
      if (req.method === "GET" && !resourceId) {
        const status = url.searchParams.get("status") || undefined;
        const studentId = url.searchParams.get("student_id") || undefined;
        return listSubscriptions(client, tenantId, { status, student_id: studentId });
      }
      
      if (req.method === "POST" && (auth.role === "teacher" || auth.role === "admin")) {
        return createSubscription(client, tenantId, body);
      }

      if (resourceId) {
        if (action === "cancel" && req.method === "POST") {
          return cancelSubscription(client, tenantId, resourceId, body);
        }
        if (action === "renew" && req.method === "POST") {
          return renewSubscription(client, tenantId, resourceId);
        }
        if (req.method === "PUT") {
          return updateSubscriptionStatus(client, tenantId, resourceId, body);
        }
      }
    }

    // ===== STUDENT SUBSCRIPTION (for students to check their own) =====
    if (endpoint === "my-subscription" && req.method === "GET") {
      // Find student by profile_id
      const { data: student } = await client
        .from("students")
        .select("id")
        .eq("profile_id", auth.profileId)
        .eq("tenant_id", tenantId)
        .single();

      if (!student) {
        return new Response(JSON.stringify({ has_subscription: false }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return getStudentSubscription(client, tenantId, student.id);
    }

    // ===== FEATURE ACCESS CHECK =====
    if (endpoint === "check-access" && req.method === "POST") {
      const { student_id, feature } = body;
      if (!student_id || !feature) {
        return new Response(JSON.stringify({ error: "student_id and feature required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return checkFeatureAccess(client, tenantId, student_id, feature);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Subscription function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/*
 * ============ FUTURE STRIPE INTEGRATION NOTES ============
 * 
 * When implementing Stripe, you'll need to:
 * 
 * 1. CREATE STRIPE CUSTOMER:
 *    - On first subscription, create Stripe customer
 *    - Store stripe_customer_id in subscriptions table
 *    - Link to student record for future purchases
 * 
 * 2. CREATE STRIPE SUBSCRIPTION:
 *    - Use stripe_price_id from plans table
 *    - Set trial_end if plan has trial_days
 *    - Configure billing_cycle_anchor for consistent billing
 * 
 * 3. WEBHOOK HANDLING (create separate edge function):
 *    - customer.subscription.created -> Update subscription status
 *    - customer.subscription.updated -> Sync changes
 *    - customer.subscription.deleted -> Mark cancelled
 *    - invoice.paid -> Renew subscription, reset classes_remaining
 *    - invoice.payment_failed -> Notify user, maybe pause subscription
 * 
 * 4. MIGRATION PATH:
 *    - For existing manual subscriptions, offer Stripe enrollment
 *    - payment_method field distinguishes: 'manual' vs 'stripe'
 *    - Can run both in parallel during transition
 * 
 * 5. CHECKOUT FLOW:
 *    - Create Stripe Checkout Session instead of WhatsApp link
 *    - Pass plan metadata for webhook processing
 *    - Redirect to success/cancel URLs
 * 
 * Example Stripe integration pseudocode:
 * 
 * async function createStripeSubscription(planId, studentId) {
 *   const stripe = new Stripe(STRIPE_SECRET_KEY);
 *   
 *   // Get or create customer
 *   const customer = await getOrCreateStripeCustomer(studentId);
 *   
 *   // Create checkout session
 *   const session = await stripe.checkout.sessions.create({
 *     customer: customer.id,
 *     mode: 'subscription',
 *     line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
 *     subscription_data: {
 *       trial_period_days: plan.trial_days || undefined,
 *       metadata: { tenant_id, student_id, plan_id }
 *     },
 *     success_url: `${FRONTEND_URL}/subscription/success`,
 *     cancel_url: `${FRONTEND_URL}/subscription/cancel`,
 *   });
 *   
 *   return { checkout_url: session.url };
 * }
 */
