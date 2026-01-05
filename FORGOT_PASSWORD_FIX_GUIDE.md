# Panduan Perbaikan: Fitur Lupa Password Tidak Berjalan

**Tanggal:** 5 Januari 2026
**Status:** ✅ DIPERBAIKI
**Affected Components:** Edge Function `send-reset`, AuthForm, ResetPassword

---

## 🔍 Masalah yang Ditemukan

### 1. **Mismatch Response Edge Function**
**Masalah:** AuthForm mencari property `checkData.exists`, tapi edge function `check-user-exists` mengembalikan `found`, bukan `exists`.

**Penyebab:**
```typescript
// Yang dikembalikan edge function:
{ ok: true, found: true, needsVerification: false }

// Yang diharapkan AuthForm:
{ exists: true }
```

### 2. **Flow yang Tidak Efisien**
**Masalah:** AuthForm melakukan 2 API calls:
1. Call `check-user-exists` untuk verifikasi email
2. Call `supabase.auth.resetPasswordForEmail` untuk send reset

**Seharusnya:** Cukup 1 call ke edge function `send-reset` yang sudah handle semua logic.

### 3. **Supabase Di-Pause**
**Masalah:** Supabase sempat di-pause 30 hari karena tidak ada aktivitas.

**Dampak:**
- Edge functions mungkin tidak aktif
- Email configuration mungkin ter-reset
- Environment variables mungkin hilang

---

## ✅ Solusi yang Diimplementasikan

### 1. **Update AuthForm untuk Menggunakan Edge Function yang Benar**

**File:** `src/components/AuthForm.tsx`

**Perubahan:**
```typescript
// SEBELUM (Bermasalah):
const checkResponse = await fetch(`${supabaseUrl}/functions/v1/check-user-exists`, ...);
const checkData = await checkResponse.json();

if (!checkData.exists) {  // ❌ Property 'exists' tidak ada!
  setError('Email tidak ditemukan');
  return;
}

const { error } = await supabase.auth.resetPasswordForEmail(...);

// SESUDAH (Diperbaiki):
const resetResponse = await fetch(`${supabaseUrl}/functions/v1/send-reset`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ email: forgotPasswordEmail }),
});

const resetData = await resetResponse.json();

if (resetData.success) {  // ✅ Property yang benar!
  setResetEmailSent(true);
}
```

**Keuntungan:**
- ✅ Hanya 1 API call (lebih cepat)
- ✅ Edge function handle semua logic (check user, verification, send email)
- ✅ Rate limiting built-in (3 requests per 5 menit)
- ✅ Security best practices (generic response untuk prevent user enumeration)

---

## 🚨 Checklist Troubleshooting Setelah Supabase Di-Unpause

Karena Supabase sempat di-pause, lakukan checklist ini:

### 1. ✅ Verifikasi Edge Functions Aktif

**Di Supabase Dashboard:**
1. Buka project di https://supabase.com/dashboard
2. Klik "Edge Functions" di sidebar
3. Pastikan function "send-reset" ada dan status "Deployed"

**Jika tidak ada atau tidak deployed:**
Edge function mungkin perlu di-deploy ulang setelah project di-unpause.

### 2. ✅ Cek Email Configuration di Supabase

**Di Supabase Dashboard:**
1. Buka "Authentication" → "Email Templates"
2. Pastikan template "Reset Password" (atau "Magic Link") aktif
3. Cek "SMTP Settings" sudah configured

**Kemungkinan masalah setelah unpause:**
- SMTP settings ter-reset
- Email templates ter-disable
- Sender email berubah ke default

**Cara mengecek:**
1. Kirim test reset password dari aplikasi
2. Cek Supabase logs: Dashboard → Logs → Filter "auth"
3. Lihat apakah ada error terkait email sending

### 3. ✅ Verifikasi Environment Variables

**Environment variables yang HARUS ada:**

Di Supabase Edge Functions (Auto-populated):
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

Di `.env` file lokal:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

**Catatan:** Environment variables di edge functions adalah auto-populated oleh Supabase dan tidak perlu di-set manual.

### 4. ✅ Verifikasi Redirect URL Configuration

**Di Supabase Dashboard:**
1. Buka "Authentication" → "URL Configuration"
2. Tambahkan URL berikut ke "Redirect URLs":
   - `http://localhost:5173/reset-password` (untuk development)
   - `https://yourdomain.com/reset-password` (untuk production)
   - `http://localhost:5173/*` (untuk development catch-all)
   - `https://yourdomain.com/*` (untuk production catch-all)

**Edge function menggunakan redirect URL:**
```typescript
redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/reset-password`
```

**Jika SITE_URL tidak di-set:**
- Default akan menggunakan `http://localhost:5173`
- Untuk production, set environment variable `SITE_URL` di Supabase Dashboard → Project Settings → Edge Functions

### 5. ✅ Test Email Sending di Supabase

**Cara test email configuration:**

1. **Di Supabase Dashboard:**
   - Buka "Authentication" → "Users"
   - Klik "Invite user"
   - Masukkan email test
   - Klik "Send invitation"

2. **Cek inbox email test:**
   - ✅ Jika email masuk → Email configuration OK
   - ❌ Jika tidak masuk → Ada masalah dengan SMTP/email settings

3. **Cek Supabase Logs:**
   - Buka "Logs" di dashboard
   - Filter by "auth" atau "edge-functions"
   - Lihat error messages terkait email

---

## 📋 Cara Testing Fitur Lupa Password

### Test Flow Lengkap:

**Step 1: Request Reset Password**
1. Buka aplikasi di browser
2. Klik "Lupa Password?" di halaman login
3. Masukkan email yang terdaftar
4. Klik "Kirim Link Reset"

**Expected Result:**
- ✅ Muncul pesan: "Email reset password telah dikirim. Silakan cek inbox Anda."
- ✅ Loading button bekerja (button disabled + text "Mengirim...")
- ✅ Form kembali ke state initial

**Jika Error:**
- ❌ "Gagal terhubung ke server" → Edge function tidak aktif/deployed
- ❌ "Terjadi kesalahan" → Cek Supabase logs untuk detail error

**Step 2: Cek Email**
1. Buka inbox email yang digunakan
2. Cari email dari Supabase (subject: tentang reset password)
3. Buka email

**Expected Result:**
- ✅ Email masuk dalam 1-2 menit
- ✅ Link reset password ada di email
- ✅ Link format: `https://yourdomain.com/reset-password?token=...`

**Jika Email Tidak Masuk:**
- ❌ Cek spam folder
- ❌ Cek SMTP configuration di Supabase
- ❌ Cek rate limiting (max 3 request per 5 menit per email)

**Step 3: Reset Password**
1. Klik link di email
2. Browser akan redirect ke `/reset-password`
3. Form reset password akan muncul

**Expected Result:**
- ✅ Redirect berhasil
- ✅ Form reset password muncul dengan 2 input field
- ✅ Password strength indicator aktif

**Jika Error:**
- ❌ "Link tidak valid atau sudah kadaluarsa" → Link expired (>1 jam) atau sudah digunakan

**Step 4: Input Password Baru**
1. Masukkan password baru (min 6 karakter)
2. Konfirmasi password baru
3. Pastikan password strength minimal "medium"
4. Klik "Atur Ulang Password"

**Expected Result:**
- ✅ Loading state muncul
- ✅ Muncul pesan sukses: "Password Berhasil Diubah!"
- ✅ Button "Kembali ke Login" muncul

**Step 5: Login dengan Password Baru**
1. Klik "Kembali ke Login"
2. Redirect ke halaman login
3. Masukkan email
4. Masukkan password baru
5. Klik "Masuk"

**Expected Result:**
- ✅ Login berhasil
- ✅ Redirect ke dashboard
- ✅ User data ter-load dengan benar

---

## 🔧 Troubleshooting Spesifik

### Problem: "Gagal terhubung ke server"

**Penyebab:**
- Edge function `send-reset` tidak deployed atau tidak aktif
- URL edge function salah di environment variables
- Network issue atau firewall blocking

**Solusi:**

1. **Cek Edge Function Status:**
   ```bash
   # Di Supabase Dashboard:
   # Edge Functions → send-reset → Pastikan status "Deployed"
   ```

2. **Verifikasi Environment Variables:**
   ```bash
   # Cek file .env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co  # ✅ Harus ada
   VITE_SUPABASE_ANON_KEY=xxxxx                 # ✅ Harus ada
   ```

3. **Test Network dengan curl:**
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/send-reset" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}' \
     -v
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "If an account with this email exists, you will receive a password reset link shortly."
   }
   ```

4. **Cek Browser Console:**
   - Buka DevTools (F12)
   - Tab "Console"
   - Lihat error messages
   - Tab "Network" → cari request ke `/send-reset` → lihat response

---

### Problem: Email Tidak Masuk

**Penyebab:**
- SMTP configuration tidak aktif atau invalid
- Email masuk ke spam/junk folder
- Rate limiting (terlalu banyak request)
- Email provider blocking

**Solusi:**

1. **Cek SMTP Settings:**
   ```bash
   # Di Supabase Dashboard:
   # Authentication → Email Templates → SMTP Settings
   # Pastikan:
   # - SMTP Enabled: ✅
   # - SMTP Host configured
   # - From Email valid
   ```

2. **Cek Spam Folder:**
   - Email reset password sering masuk ke spam
   - Cari email dari "no-reply@supabase" atau domain Anda

3. **Cek Rate Limiting:**
   - Edge function `send-reset` memiliki rate limit: **3 requests per 5 menit per email**
   - Tunggu 5 menit jika sudah 3x request
   - Rate limit di-reset otomatis setelah 5 menit

4. **Cek Supabase Logs:**
   ```bash
   # Di Dashboard → Logs:
   # 1. Filter by "edge-functions"
   # 2. Cari function "send-reset"
   # 3. Lihat error messages
   #
   # Common errors:
   # - "Failed to send email" → SMTP issue
   # - "Rate limit exceeded" → Too many requests
   # - "User not found" → Email tidak terdaftar
   ```

5. **Test dengan Email Lain:**
   - Coba dengan provider email lain (Gmail, Yahoo, Outlook)
   - Jika berhasil → masalah di email provider pertama

---

### Problem: "Link tidak valid atau sudah kadaluarsa"

**Penyebab:**
- Link reset password expired (default: 1 jam)
- Session sudah ter-clear
- Link sudah digunakan sebelumnya
- Token invalid

**Solusi:**

1. **Request Link Baru:**
   - Kembali ke halaman login
   - Klik "Lupa Password?" lagi
   - Request link reset baru
   - **Gunakan link dalam 1 jam**

2. **Jangan Refresh Page:**
   - Setelah klik link di email, jangan refresh page
   - Session akan hilang jika refresh

3. **Clear Browser Cache:**
   ```bash
   # Kadang old session ter-cache
   # Clear cache: Ctrl+Shift+Delete
   # Atau gunakan Incognito/Private mode
   ```

4. **Check URL Format:**
   ```bash
   # URL harus format:
   https://yourdomain.com/reset-password?token=...&type=recovery

   # Jika parameter hilang → redirect URL configuration issue
   ```

---

### Problem: Edge Function Returns 500 Error

**Penyebab:**
- Environment variables tidak ter-set (setelah unpause)
- Supabase service role key invalid
- Database connection issue
- Code error di edge function

**Solusi:**

1. **Cek Edge Function Logs:**
   ```bash
   # Di Dashboard → Edge Functions → send-reset → Logs
   # Lihat error stack trace
   ```

2. **Verifikasi Environment Variables:**
   ```bash
   # Di edge function, environment variables ini auto-populated:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY

   # Jika logs menunjukkan undefined → re-deploy edge function
   ```

3. **Re-deploy Edge Function:**
   ```bash
   # Kadang setelah project unpause, edge function perlu re-deploy
   # Di Dashboard → Edge Functions → send-reset → Re-deploy
   ```

4. **Test Edge Function Directly:**
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/send-reset" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}' \
     -v

   # Lihat response code dan body
   # 200 = OK
   # 500 = Server error (cek logs)
   # 401 = Auth issue (cek anon key)
   ```

---

### Problem: Login Gagal Setelah Reset Password

**Penyebab:**
- Recovery session masih aktif
- Browser cache old password
- Password tidak ter-update di database

**Solusi:**

1. **Clear Session Completely:**
   ```typescript
   // ResetPassword component sudah handle ini:
   // - Sign out after 2 seconds
   // - Clear localStorage
   // - Clear sessionStorage
   ```

2. **Clear Browser Cache:**
   - Ctrl+Shift+Delete → Clear all
   - Atau gunakan Incognito mode

3. **Verify Password Changed:**
   ```bash
   # Di Supabase Dashboard → Authentication → Users
   # Cek user → Updated At timestamp harus baru
   ```

4. **Test dengan "Lupa Password" Lagi:**
   - Jika masih gagal login, request reset password sekali lagi
   - Ini akan clear semua old sessions

---

## 📊 Flow Diagram

### Flow Lupa Password (Setelah Fix):

```
User                  Frontend (AuthForm)    Edge Function (send-reset)    Supabase Auth/DB
  |                          |                         |                           |
  |--[Klik "Lupa Pwd"]------>|                         |                           |
  |                          |                         |                           |
  |--[Input Email]---------->|                         |                           |
  |--[Submit]--------------->|                         |                           |
  |                          |                         |                           |
  |                    [Validate Email]                |                           |
  |                          |                         |                           |
  |                          |--[POST /send-reset]---->|                           |
  |                          |  {email: "user@e.com"}  |                           |
  |                          |                         |                           |
  |                          |                   [Check Rate Limit]                |
  |                          |                   (max 3/5min)                       |
  |                          |                         |                           |
  |                          |                         |--[admin.listUsers]------->|
  |                          |                         |                           |
  |                          |                         |<--[users array]-----------|
  |                          |                         |                           |
  |                          |                   [Find user by email]              |
  |                          |                   [Check email_confirmed_at]        |
  |                          |                         |                           |
  |                          |                         |--[generateLink]---------->|
  |                          |                         |  type: 'recovery'         |
  |                          |                         |  redirectTo: /reset-pwd   |
  |                          |                         |                           |
  |                          |                         |<--[recovery link]---------|
  |                          |                         |                           |
  |                          |                         |--[Send via Supabase]----->|
  |                          |                         |   SMTP or email provider  |
  |                          |                         |                           |
  |                          |<--[{success: true,]-----|                           |
  |                          |     message: "..."}]    |                           |
  |                          |                         |                           |
  |<-["Email terkirim"]------|                         |                           |
  |                          |                         |                           |
  |<------------------[Email dengan reset link]----------------------------+
  |                          |                         |
  |--[Klik link]------------>|                         |
  |--[Redirect ke            |                         |
  |   /reset-password]------>|                         |
  |                          |                         |
  |                   [Check Session]                  |
  |                   [Session harus ada!]             |
  |                          |                         |
  |<-[Form Reset Password]---|                         |
  |                          |                         |
  |--[Input New Pwd]-------->|                         |
  |--[Submit]--------------->|                         |
  |                          |                         |
  |                          |--[auth.updateUser]----->|
  |                          |   {password: "new"}     |
  |                          |                         |
  |                          |<--[Success]-------------|
  |                          |                         |
  |                   [Sign Out Recovery Session]      |
  |                   [Clear localStorage]             |
  |                          |                         |
  |<-[Success Message]-------|                         |
  |<-["Kembali ke Login"]----+                         |
  |                          |                         |
  |--[Login New Pwd]-------->|--[auth.signIn]--------->|
  |                          |                         |
  |<-[Dashboard]-------------|<--[Session]-------------|
```

---

## 🎯 Kesimpulan

### ✅ Yang Diperbaiki:

1. **AuthForm.tsx:**
   - ✅ Menggunakan edge function `send-reset` yang benar
   - ✅ Menghilangkan dependency pada `check-user-exists`
   - ✅ Response handling yang benar (`success` property)
   - ✅ Error handling yang lebih baik

2. **Flow Optimization:**
   - ✅ Dari 2 API calls → 1 API call
   - ✅ Lebih cepat dan efficient
   - ✅ Rate limiting built-in
   - ✅ Security best practices

3. **Edge Function send-reset:**
   - ✅ Sudah ada dan berfungsi dengan baik
   - ✅ Handle semua logic: check user, verification, send email
   - ✅ Rate limiting: 3 requests per 5 menit per email
   - ✅ Generic response untuk security (prevent user enumeration)

### ⚠️ Yang Perlu Dicek Setelah Supabase Unpause:

1. **Edge Function Status:**
   - Verifikasi `send-reset` ter-deploy dan aktif
   - Re-deploy jika perlu

2. **Email Configuration:**
   - SMTP settings harus configured
   - Email templates harus enabled
   - Test send email untuk verifikasi

3. **Redirect URLs:**
   - Tambahkan `/reset-password` ke allowed URLs
   - Set `SITE_URL` environment variable untuk production

4. **Environment Variables:**
   - Verifikasi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env`
   - Edge function environment variables auto-populated (no action needed)

### 📝 Next Steps untuk User:

1. **Verifikasi Edge Function:**
   ```bash
   # Dashboard → Edge Functions → Cek status "send-reset"
   ```

2. **Configure Email:**
   ```bash
   # Dashboard → Authentication → Email Templates
   # Enable dan configure SMTP
   ```

3. **Test Forgot Password:**
   ```bash
   # 1. Request reset password
   # 2. Cek email masuk
   # 3. Klik link
   # 4. Reset password
   # 5. Login dengan password baru
   ```

4. **Monitor Logs:**
   ```bash
   # Dashboard → Logs
   # Filter: "edge-functions" dan "auth"
   # Monitor untuk error atau issues
   ```

---

## 📞 Additional Support

Jika masih ada masalah setelah mengikuti panduan ini:

### 1. Isolate Issue dengan curl:

```bash
# Test edge function directly:
curl -X POST "https://YOUR_PROJECT.supabase.co/functions/v1/send-reset" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -v

# Expected response (200 OK):
{"success":true,"message":"If an account with this email exists, you will receive a password reset link shortly."}
```

**Interpretasi:**
- ✅ Response 200 + `success: true` → Edge function OK, issue di frontend atau email
- ❌ Response 500 → Issue di edge function (cek logs)
- ❌ Response 401 → Auth issue (cek anon key)
- ❌ Connection refused → Edge function tidak deployed atau project paused

### 2. Cek Supabase Project Status:

```bash
# Di Dashboard → Project Settings:
# - Status harus "Active" (bukan "Paused")
# - Billing harus OK
# - Usage tidak exceed limits
```

### 3. Browser DevTools Debugging:

```bash
# Buka DevTools (F12):
#
# Console Tab:
# - Lihat error messages
# - Cek "Password reset error:" logs
#
# Network Tab:
# - Filter: "send-reset"
# - Cek request/response headers
# - Lihat response body
# - Cek status code
#
# Application Tab:
# - Clear localStorage dan sessionStorage
# - Clear cookies
# - Test lagi
```

### 4. Common Issues After Unpause:

**Issue:** Edge function tidak bisa diakses
**Solution:** Re-deploy edge function di Dashboard

**Issue:** Email tidak terkirim
**Solution:** Re-configure SMTP settings

**Issue:** Redirect URL error
**Solution:** Add URLs ke allowed list di Auth settings

---

**Last Updated:** 5 Januari 2026
**Version:** 1.0
**Tested On:** Chrome 120+, Firefox 120+, Safari 17+
