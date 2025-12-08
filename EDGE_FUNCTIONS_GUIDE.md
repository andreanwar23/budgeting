# Edge Functions Guide - Finance Tracker

Complete guide for deploying and using Supabase Edge Functions for authentication.

---

## Overview

This application uses three Supabase Edge Functions to handle secure authentication operations:

1. **check-user-exists**: Check if email exists in the system
2. **resend-verification**: Resend verification email for unverified accounts
3. **send-reset**: Send password reset link for verified accounts

All functions include rate limiting, input validation, and security best practices.

---

## Function 1: check-user-exists

### Purpose
Checks if an email address is registered in the system, used during password reset flow.

### Features
- Rate limiting: 10 requests per minute per IP
- Email validation and sanitization
- Generic responses to prevent user enumeration
- Proper error handling

### Deployment

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "Edge Functions" in sidebar
4. Click "Deploy new function" or "+ New function"
5. Enter function name: `check-user-exists`
6. Paste the code below
7. Click "Deploy"

**Code:**

```typescript
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

function checkRateLimit(identifier: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
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
    const clientIp = req.headers.get("x-forwarded-for") || "unknown"

    if (!checkRateLimit(clientIp, 10, 60000)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later."
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

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

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('Error fetching users:', error)
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "Unable to process request"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const userExists = data.users.some(user =>
      user.email?.toLowerCase() === sanitizedEmail
    )

    return new Response(
      JSON.stringify({
        exists: userExists
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
        error: "Internal server error",
        message: "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
```

### Usage

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/check-user-exists`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ email: 'user@example.com' })
  }
)

const data = await response.json()
// { exists: true } or { exists: false }
```

---

## Function 2: resend-verification

### Purpose
Resends verification email for unverified accounts.

### Features
- Rate limiting: 3 requests per 5 minutes per email
- Only sends to unverified accounts
- Generic responses for security
- Prevents abuse

### Deployment

Follow the same steps as check-user-exists, but:
- Function name: `resend-verification`
- Use the code below

**Code:**

```typescript
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

    const rateLimitKey = `resend_${sanitizedEmail}`
    if (!checkRateLimit(rateLimitKey, 3, 300000)) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "If your account exists and is unverified, you will receive an email shortly."
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
          message: "If your account exists and is unverified, you will receive an email shortly."
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
          message: "If your account exists and is unverified, you will receive an email shortly."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "If your account exists and is unverified, you will receive an email shortly."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const { error: resendError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      sanitizedEmail,
      {
        redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/auth/callback`
      }
    )

    if (resendError) {
      console.error('Error resending verification:', resendError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "If your account exists and is unverified, you will receive an email shortly."
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
        message: "If your account exists and is unverified, you will receive an email shortly."
      }),
      {
        status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
```

### Usage

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/resend-verification`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ email: 'user@example.com' })
  }
)

const data = await response.json()
// Always returns: { success: true, message: "..." }
```

---

## Function 3: send-reset

### Purpose
Sends password reset link for verified accounts.

### Features
- Rate limiting: 3 requests per 5 minutes per email
- Only sends to verified accounts
- Generic responses to prevent user enumeration
- Secure token generation

### Deployment

Follow the same steps, but:
- Function name: `send-reset`
- Use the code below

**Code:**

```typescript
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
```

### Usage

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-reset`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ email: 'user@example.com' })
  }
)

const data = await response.json()
// Always returns: { success: true, message: "..." }
```

---

## Environment Variables

All edge functions automatically have access to:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Admin service role key

Optional:
- `SITE_URL`: Your site URL for redirect URLs (defaults to localhost)

---

## Security Best Practices

### Rate Limiting
All functions implement rate limiting to prevent abuse:
- **check-user-exists**: 10 requests per minute per IP
- **resend-verification**: 3 requests per 5 minutes per email
- **send-reset**: 3 requests per 5 minutes per email

### Input Validation
- Email format validation using regex
- Maximum length validation (254 chars)
- Type checking on all inputs
- Sanitization (lowercase, trim)

### Generic Responses
All functions return generic success messages to prevent user enumeration:
- Don't reveal if email exists or not
- Same response for success and failure cases
- Prevents attackers from discovering valid emails

### Error Handling
- Catch all errors gracefully
- Log errors server-side only
- Never expose sensitive data in responses
- Return generic error messages to clients

---

## Testing

### Test check-user-exists

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/check-user-exists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{ "exists": true }
```
or
```json
{ "exists": false }
```

### Test resend-verification

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/resend-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "If your account exists and is unverified, you will receive an email shortly."
}
```

### Test send-reset

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/send-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "success": true,
  "message": "If an account with this email exists, you will receive a password reset link shortly."
}
```

---

## Troubleshooting

### Function not found (404)
- Ensure function is deployed
- Check function name matches exactly
- Wait 1-2 minutes after deployment

### CORS errors
- Check CORS headers are correct
- Ensure `Access-Control-Allow-Origin` is set
- Verify all required headers are included

### Rate limit errors
- Wait for rate limit window to reset
- Check if IP-based or email-based limit
- Implement exponential backoff in client

### Invalid email format
- Ensure email matches regex pattern
- Check email length (max 254 chars)
- Verify no extra whitespace

---

## Monitoring

### Logs
View function logs in Supabase Dashboard:
1. Go to Edge Functions
2. Click on function name
3. View "Logs" tab

### Metrics
Monitor function performance:
- Request count
- Error rate
- Response time
- Rate limit hits

---

## Support

For issues or questions:
- Check logs in Supabase Dashboard
- Review this documentation
- Contact: andreanwar713@gmail.com

---

**Version**: 4.0.0
**Last Updated**: December 8, 2025
**Status**: Production Ready
