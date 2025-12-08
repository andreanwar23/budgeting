# Deployment Guide - Finance Tracker v4.1.0

## Complete Step-by-Step Deployment Instructions

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Access to Supabase project (dashboard & credentials)
- [ ] Git repository with latest code
- [ ] Node.js 18+ and npm installed
- [ ] Deployment platform account (Netlify/Vercel/Railway)
- [ ] `.env` file with correct Supabase credentials

---

## 🗄️ Step 1: Database Setup

### Option A: Fresh Installation (Recommended for New Projects)

1. **Login to Supabase Dashboard**
   ```
   https://app.supabase.com
   ```

2. **Open SQL Editor**
   - Navigate to your project
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run Consolidated Migration**
   - Open `migrations.sql` from project root
   - Copy ENTIRE file contents
   - Paste into SQL Editor
   - Click **"Run"** or press `Ctrl/Cmd + Enter`

4. **Verify Tables Created**
   Run this query:
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

   Expected output:
   ```
   categories
   kasbon
   transactions
   user_profiles  ← NEW!
   user_settings
   ```

5. **Verify Storage Bucket**
   - Go to "Storage" in Supabase Dashboard
   - Confirm "avatars" bucket exists
   - Check that it's set to "Public"

### Option B: Upgrade from v3.x

If you already have existing database from v3.x:

1. **Only run user_profiles migration**
   ```sql
   -- Copy contents from:
   supabase/migrations/20251128083233_create_user_profiles_table.sql
   ```

2. **Verify no conflicts**
   ```sql
   SELECT * FROM user_profiles LIMIT 1;
   ```

---

## 🏗️ Step 2: Build Application

### 1. Install Dependencies

```bash
cd finance-tracker
npm install
```

### 2. Configure Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get credentials:**
1. Supabase Dashboard → Settings → API
2. Copy "Project URL" → VITE_SUPABASE_URL
3. Copy "anon public" key → VITE_SUPABASE_ANON_KEY

### 3. Test Locally

```bash
npm run dev
```

Open http://localhost:5173 and test:
- [ ] Login/signup works
- [ ] Can create transaction
- [ ] Can upload avatar in profile
- [ ] Avatar shows in sidebar
- [ ] Reports page shows (test with empty state)
- [ ] Dark mode toggle works

### 4. Build for Production

```bash
npm run build
```

Expected output:
```
✓ built in 13.92s
dist/index.html
dist/assets/...
```

---

## 🚀 Step 3: Deploy to Platform

### Option A: Netlify

#### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

#### Via Dashboard

1. Go to https://app.netlify.com
2. Click "Add new site" → "Deploy manually"
3. Drag & drop `dist/` folder
4. Wait for deployment to complete
5. **Configure Environment Variables:**
   - Site settings → Environment variables
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
6. **Configure Redirects:**
   - Create `netlify.toml` in project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Or via Dashboard:**
1. Go to https://vercel.com
2. Import from Git
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. **Environment Variables:**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`

### Option C: Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. **Environment Variables:**
   - Add `VITE_SUPABASE_URL`
   - Add `VITE_SUPABASE_ANON_KEY`
5. Railway auto-detects Vite and builds

---

## ✅ Step 4: Post-Deployment Verification

### 1. Test Core Features

Visit your deployed URL and test:

#### Authentication
- [ ] Sign up new user
- [ ] Verify email works (check Supabase auth settings)
- [ ] Login with new account
- [ ] Logout and login again

#### Profile Management
- [ ] Click avatar in sidebar
- [ ] Opens Profile tab in Settings
- [ ] Upload profile photo
  - [ ] Try valid image (should work)
  - [ ] Try >2MB image (should reject)
  - [ ] Try non-image file (should reject)
- [ ] Fill in name, phone, bio
- [ ] Click "Simpan Perubahan"
- [ ] Verify avatar updates in sidebar
- [ ] Refresh page - avatar persists

#### Transactions
- [ ] Create income transaction
- [ ] Create expense transaction
- [ ] Edit transaction
- [ ] Delete transaction
- [ ] Filter by date range
- [ ] Search transactions

#### Reports
- [ ] **NEW USER:** Should see empty state with onboarding
- [ ] **WITH DATA:** Should see charts
- [ ] Click category in chart → detail panel opens
- [ ] Export to Excel works
- [ ] Date filter works on first click

#### Kasbon
- [ ] Add new kasbon (form simplified)
- [ ] Mark as paid (paid_date sets automatically)
- [ ] View kasbon list

#### Settings
- [ ] Theme toggle works (light/dark)
- [ ] Language switch works (EN/ID)
- [ ] Currency switch works (USD/IDR)
- [ ] Preferences save and persist
- [ ] Switch between Preferences/Profile tabs

### 2. Cross-Browser Testing

Test on:
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### 3. Mobile Responsive Testing

- [ ] Sidebar opens/closes on mobile
- [ ] Sidebar scrolls properly (iOS Safari)
- [ ] Avatar clickable on mobile
- [ ] Forms usable on small screens
- [ ] Charts touchable/tappable
- [ ] Navigation smooth

### 4. Performance Check

- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] Images load quickly
- [ ] Smooth transitions
- [ ] No memory leaks (test with repeated navigation)

---

## 🔧 Step 5: Configuration & Optimization

### Enable Supabase Email Confirmation (Optional)

1. Supabase Dashboard → Authentication → Settings
2. Enable "Confirm email"
3. Update site URL to your deployed URL
4. Configure email templates

### Setup Custom Domain (Optional)

#### Netlify
1. Site settings → Domain management
2. Add custom domain
3. Configure DNS records
4. Wait for SSL provisioning

#### Vercel
1. Project settings → Domains
2. Add domain
3. Configure DNS
4. Auto SSL

### Enable Analytics (Optional)

Add analytics script to `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

## 🐛 Troubleshooting

### Issue: "Cannot read properties of null (reading 'avatar_url')"

**Cause:** User profile not created automatically

**Fix:**
1. ProfileManager creates profile on first access
2. Ensure user visits Settings → Profile at least once
3. Or create profile programmatically on signup

### Issue: Avatar not uploading

**Causes & Fixes:**

1. **File too large**
   - Check file size < 2MB
   - Compress image before upload

2. **Storage bucket missing**
   - Verify "avatars" bucket exists in Supabase
   - Check bucket is public
   - Re-run storage setup from migrations.sql

3. **RLS policy blocking**
   - Check storage policies in Supabase
   - Verify user is authenticated
   - Test policy with:
   ```sql
   SELECT * FROM storage.objects WHERE bucket_id = 'avatars';
   ```

### Issue: Reports stuck loading

**Fix:** Already fixed in v4.1.0!
- Ensure Charts.tsx has `initialLoadComplete` state
- Check console for errors
- Verify transactions table accessible

### Issue: Environment variables not working

**Check:**
1. Variables have `VITE_` prefix
2. Rebuild after adding variables
3. For Netlify/Vercel: Set in dashboard, not just .env
4. Clear cache and redeploy

### Issue: 404 on page refresh

**Fix:** Add redirect rules (see deployment configs above)

### Issue: Dark mode not persisting

**Causes:**
1. user_settings table missing
2. RLS policy blocking
3. Browser blocking localStorage

**Fix:**
1. Verify user_settings table exists
2. Check RLS policies
3. Test in incognito mode

---

## 📊 Monitoring & Maintenance

### Weekly Checks

- [ ] Check Supabase usage (database size, API calls)
- [ ] Review error logs
- [ ] Test critical user flows
- [ ] Check for security updates

### Monthly Tasks

- [ ] Review and archive old transactions
- [ ] Database backup (Supabase auto-backs up)
- [ ] Update dependencies:
  ```bash
  npm outdated
  npm update
  ```
- [ ] Performance audit with Lighthouse

### When Issues Occur

1. **Check Supabase Logs:**
   - Dashboard → Logs → Database / API
2. **Check Browser Console**
3. **Check Network Tab**
4. **Verify RLS policies**
5. **Test with new user account**

---

## 🎉 Deployment Complete!

Your Finance Tracker v4.1.0 is now live with:
- ✅ Profile management with avatar upload
- ✅ Improved navigation
- ✅ Bug fixes for new users
- ✅ Full database setup
- ✅ Production-ready configuration

**Next Steps:**
1. Share app with users
2. Collect feedback
3. Monitor for issues
4. Plan next features

**Support:**
- Email: andreanwar713@gmail.com
- Issues: GitHub repository
- Docs: README.md & CHANGELOG.md

---

**Deployment Date:** December 8, 2025
**Version:** 4.1.0
**Status:** Production Ready ✅
