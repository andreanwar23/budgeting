# 🚀 Cara Deploy Edge Function (5 Menit)

## Masalah Anda Sekarang

Screenshot Anda menunjukkan:
- ❌ `check-user-exists`: CORS error
- ❌ `check-user-exists`: 404

**Artinya**: Edge function belum di-deploy.

---

## ⚡ Solusi Paling Mudah: Deploy via Supabase Dashboard

### Langkah 1: Buka Supabase Dashboard

1. Buka browser → https://supabase.com/dashboard
2. Login dengan akun Anda
3. Pilih project **Budgeting Uang** (atau project yang Anda pakai)

### Langkah 2: Buka Menu Edge Functions

1. Di sidebar kiri, cari menu **"Edge Functions"**
2. Klik **"Edge Functions"**

### Langkah 3: Create New Function

1. Klik tombol **"Deploy new function"** atau **"New function"**
2. Isi form:
   - **Function name**: `check-user-exists` (HARUS SAMA PERSIS)
   - **Region**: Pilih yang terdekat (Singapore / Asia)

### Langkah 4: Paste Code

Copy code ini dan paste ke editor:

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
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

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      throw error
    }

    const userExists = users.users.some(user => user.email === email.toLowerCase())

    return new Response(
      JSON.stringify({
        exists: userExists,
        message: userExists ? "User found" : "User not found"
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

### Langkah 5: Deploy

1. Klik tombol **"Deploy"** atau **"Save and deploy"**
2. Tunggu beberapa detik
3. Lihat status berubah menjadi **"Active"** atau **"Deployed"**

### Langkah 6: Test

1. **Refresh aplikasi Anda** (Ctrl + Shift + R)
2. Klik **"Lupa password?"**
3. Masukkan email yang **TIDAK terdaftar** (contoh: `test123@example.com`)
4. Klik **"Kirim Link"**

**Expected Result**:
```
❌ Email tidak ditemukan dalam sistem kami.

   Belum punya akun? Klik "Daftar" untuk membuat akun baru.
```

---

## 📸 Visual Guide

### Tampilan Supabase Dashboard

```
┌─────────────────────────────────────────────┐
│ Supabase Dashboard                          │
│                                             │
│ ┌─────────────┐                            │
│ │ Dashboard   │                            │
│ │ Authentication                           │
│ │ Database    │                            │
│ │ Storage     │                            │
│ │ ► Edge Functions  ← KLIK INI             │
│ │ Logs        │                            │
│ └─────────────┘                            │
│                                             │
│ Edge Functions                              │
│ ┌──────────────────────────────────────┐   │
│ │  [+ Deploy new function]              │  │
│ └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### Form Create Function

```
┌─────────────────────────────────────────────┐
│ Create new function                         │
│                                             │
│ Function name:                              │
│ ┌─────────────────────────────────────┐    │
│ │ check-user-exists                    │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Region:                                     │
│ ┌─────────────────────────────────────┐    │
│ │ [Select region]                      │    │
│ └─────────────────────────────────────┘    │
│                                             │
│ Code:                                       │
│ ┌─────────────────────────────────────┐    │
│ │ import { createClient } ...          │    │
│ │                                      │    │
│ │ [PASTE CODE HERE]                    │    │
│ │                                      │    │
│ └─────────────────────────────────────┘    │
│                                             │
│          [Cancel]    [Deploy]               │
└─────────────────────────────────────────────┘
```

---

## ⚠️ Troubleshooting

### "Function name already exists"
**Solusi**: Klik function yang sudah ada, update codenya, lalu klik "Redeploy"

### "Permission denied"
**Solusi**: Pastikan Anda adalah owner atau admin dari project Supabase

### Setelah deploy masih error 404
**Solusi**:
1. Tunggu 1-2 menit (propagation time)
2. Hard refresh browser (Ctrl + Shift + R)
3. Clear browser cache
4. Coba lagi

### Masih dapat CORS error
**Solusi**:
1. Pastikan code yang di-paste PERSIS sama (termasuk CORS headers)
2. Redeploy function
3. Clear browser cache

---

## 🎯 Verifikasi Deploy Berhasil

### Cara 1: Via Supabase Dashboard

1. Buka Edge Functions
2. Klik `check-user-exists`
3. Lihat status:
   - ✅ **Active** / **Deployed** = Berhasil!
   - ❌ **Error** / **Failed** = Ada masalah

### Cara 2: Via Browser DevTools

1. Buka aplikasi
2. Tekan F12 (Developer Tools)
3. Tab "Network"
4. Coba reset password dengan email tidak terdaftar
5. Cari request `check-user-exists`
6. Status:
   - ✅ **200 OK** = Berhasil!
   - ❌ **404** = Belum deployed
   - ❌ **CORS error** = Ada masalah CORS

### Cara 3: Via curl (Optional)

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-user-exists \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Response sukses:
```json
{
  "exists": false,
  "message": "User not found"
}
```

---

## 📱 Test Scenarios

### Scenario 1: Email Tidak Terdaftar

**Input**: `notregistered@example.com`

**Expected**:
```
❌ Email tidak ditemukan dalam sistem kami.

   Belum punya akun? Klik "Daftar" untuk membuat akun baru.
```

### Scenario 2: Email Terdaftar

**Input**: `andreanwarr2@gmail.com` (email Anda yang terdaftar)

**Expected**:
```
✅ Link reset password telah dikirim!

   Silakan cek inbox email Anda dan klik link
   untuk mengatur ulang password.
```

---

## 🎉 Selesai!

Setelah deploy edge function, aplikasi Anda akan:

✅ Cek email terlebih dahulu sebelum kirim reset link
✅ Tampilkan pesan error jelas untuk email tidak terdaftar
✅ Tampilkan pesan sukses untuk email terdaftar
✅ User experience lebih baik

---

## 📞 Butuh Bantuan?

Jika masih ada masalah:

1. **Screenshot**:
   - Supabase Dashboard (Edge Functions page)
   - Browser DevTools (Network tab)
   - Error message di aplikasi

2. **Info Project**:
   - Project name di Supabase
   - Error message lengkap

Saya akan bantu troubleshoot! 🚀

---

## ⏱️ Estimasi Waktu

| Langkah | Waktu |
|---------|-------|
| Login Supabase | 30 detik |
| Buka Edge Functions | 10 detik |
| Create function | 1 menit |
| Paste code | 30 detik |
| Deploy | 1 menit |
| Test | 1 menit |
| **Total** | **~5 menit** |

---

**GAMPANG KAN?** 😊

Setelah deploy, langsung test ya! 🎯
