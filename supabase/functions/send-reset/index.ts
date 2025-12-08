import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number }
}

const rateLimits: RateLimitStore = {}

function checkRateLimit(identifier: string, maxRequests: number = 3, windowMs: number = 300000): boolean {
  const now = Date.now()
  const limit = rateLimits[identifier]

  if (!limit || now > limit.resetAt) {
    rateLimits[identifier] = { count: 1, resetAt: now + windowMs }
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }

  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const sanitizedEmail = sanitizeEmail(email)

    if (!validateEmail(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const rateLimitKey = `reset_${sanitizedEmail}`
    if (!checkRateLimit(rateLimitKey, 3, 300000)) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account with this email exists, you will receive a password reset link shortly."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers()

    if (userError) {
      console.error('Error fetching users:', userError)
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account with this email exists, you will receive a password reset link shortly."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === sanitizedEmail)

    if (!user) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account with this email exists, you will receive a password reset link shortly."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account with this email exists, you will receive a password reset link shortly."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: sanitizedEmail,
      options: {
        redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/reset-password`
      }
    })

    if (resetError) {
      console.error('Error sending reset link:', resetError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account with this email exists, you will receive a password reset link shortly."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)

    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account with this email exists, you will receive a password reset link shortly."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
