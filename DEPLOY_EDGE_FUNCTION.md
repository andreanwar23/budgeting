# Deploy Edge Function: check-user-exists

## ⚠️ Masalah Saat Ini

Ketika mencoba reset password dengan email tidak terdaftar, muncul error:
```
Gagal terhubung ke server. Periksa koneksi internet Anda.
```

**Penyebab**: Edge function `check-user-exists` belum di-deploy (error 404 & CORS)

---

## 🚀 Cara Deploy Edge Function

### Opsi 1: Deploy via Supabase Dashboard (PALING MUDAH)

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com/dashboard
   - Pilih project Anda

2. **Buka Edge Functions**
   - Klik "Edge Functions" di sidebar kiri
   - Klik "Create a new function"

3. **Buat Function**
   - Function name: `check-user-exists`
   - Copy-paste code berikut:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Create Supabase client with service role key (has admin privileges)
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

    // Check if user exists
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      throw error
    }

    // Check if email exists in the user list
    const userExists = users.users.some(user => user.email === email.toLowerCase())

    return new Response(
      JSON.stringify({
        exists: userExists,
        message: userExists
          ? "User found"
          : "User not found"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error('Error checking user:', error)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
```

4. **Deploy Function**
   - Klik "Deploy" atau "Save"
   - Tunggu sampai status berubah menjadi "Active"

---

### Opsi 2: Deploy via Supabase CLI

Jika Anda sudah install Supabase CLI:

```bash
# 1. Login ke Supabase
supabase login

# 2. Link project (jika belum)
supabase link --project-ref YOUR_PROJECT_REF

# 3. Deploy function
supabase functions deploy check-user-exists

# 4. Verify deployment
supabase functions list
```

---

## ✅ Cara Test Setelah Deploy

### 1. Test via curl (Optional)

```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-user-exists' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"email":"test@example.com"}'
```

Response untuk email tidak terdaftar:
```json
{
  "exists": false,
  "message": "User not found"
}
```

### 2. Test via Aplikasi

1. **Buka aplikasi Anda**
2. **Klik "Lupa password?"**
3. **Masukkan email yang TIDAK terdaftar** (contoh: `test123@example.com`)
4. **Klik "Kirim Link"**

**Expected Result**:
```
❌ Email tidak ditemukan dalam sistem kami.

Belum punya akun? Klik "Daftar" untuk membuat akun baru.
```

5. **Test dengan email yang TERDAFTAR** (email Anda yang sebenarnya)
6. **Expected Result**:
```
✅ Link reset password telah dikirim!

Silakan cek inbox email Anda dan klik link untuk
mengatur ulang password.
```

---

## 🔍 Troubleshooting

### Error: "CORS error"
**Solusi**: CORS headers sudah ada di code, coba hard refresh browser (Ctrl+Shift+R)

### Error: "404 Not Found"
**Solusi**: Edge function belum deployed. Ulangi langkah deploy di atas.

### Error: "Internal server error"
**Solusi**:
1. Buka Supabase Dashboard → Edge Functions → check-user-exists
2. Klik "Logs" untuk lihat error detail
3. Pastikan environment variables sudah ada (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

### Error: "Failed to fetch"
**Solusi**:
1. Cek koneksi internet
2. Cek apakah Supabase project masih aktif
3. Clear browser cache (Ctrl+Shift+Delete)

---

## 📊 Monitoring

### Check Function Status

1. Buka Supabase Dashboard
2. Klik "Edge Functions"
3. Lihat status `check-user-exists`:
   - ✅ **Active**: Function sudah deployed dan running
   - ❌ **Inactive**: Function belum deployed atau ada error

### View Logs

1. Klik function name `check-user-exists`
2. Tab "Logs"
3. Lihat request logs dan error logs

---

## 🎯 Summary

**Yang Perlu Dilakukan**:

1. ✅ Edge function code sudah diperbaiki di: `supabase/functions/check-user-exists/index.ts`
2. ⚠️ **Deploy edge function** via Dashboard atau CLI (pilih salah satu)
3. ✅ Test dengan email tidak terdaftar
4. ✅ Test dengan email terdaftar

**Setelah Deploy Berhasil**:
- Password reset akan cek email terlebih dahulu
- Email tidak terdaftar = Pesan error jelas
- Email terdaftar = Kirim reset link

---

## 🚀 Next Steps

Setelah edge function berhasil di-deploy:

1. **Test aplikasi** dengan berbagai skenario
2. **Monitor logs** untuk error
3. **Deploy frontend** ke production
4. **Done!** ✅

---

**Need Help?**

Jika masih ada error setelah deploy, screenshot:
1. Network tab (Chrome DevTools)
2. Edge Function logs (Supabase Dashboard)
3. Error message yang muncul di aplikasi

Saya akan bantu troubleshoot lebih lanjut! 🚀
