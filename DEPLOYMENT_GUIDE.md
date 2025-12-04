# Complete Deployment Guide - BU Finance Tracker

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Build Process](#build-process)
5. [Web Deployment](#web-deployment)
   - [Netlify](#deploy-to-netlify)
   - [Vercel](#deploy-to-vercel)
   - [Railway](#deploy-to-railway)
6. [Mobile App (APK)](#mobile-app-apk-conversion)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm 9+ installed
- ✅ Supabase account with project created
- ✅ Git installed (for deployment platforms)
- ✅ Code pushed to GitHub/GitLab (for auto-deployments)

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter project details:
   - **Name**: BU Finance Tracker
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Click "Create Project" and wait ~2 minutes

### Step 2: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Open `COMPLETE_DATABASE_SETUP.sql` from your project
4. Copy and paste the ENTIRE file into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`
6. Wait for success message (should see ✅ in output)

### Step 3: Verify Database Setup

Run this query to verify all tables exist:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see:
- categories
- kasbon
- transactions
- user_profiles
- user_settings

### Step 4: Get API Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **Anon (public) key**: `eyJhbG...` (long string)

---

## Environment Configuration

### Create `.env` File

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
```

**IMPORTANT**:
- Never commit `.env` to Git
- Variables must start with `VITE_` prefix
- No spaces around `=` sign

### Verify Environment Variables

Test locally:

```bash
npm run dev
```

Visit `http://localhost:5173` and try:
1. Sign up with a new account
2. Verify email (check inbox/spam)
3. Log in
4. Add a test transaction
5. Check if data saves correctly

If everything works locally, you're ready to deploy!

---

## Build Process

### Build for Production

```bash
# Install dependencies (if not already done)
npm install

# Run type checking
npm run typecheck

# Build production bundle
npm run build
```

Output will be in `dist/` folder containing:
- `index.html`
- `assets/` (JS, CSS, images)

### Test Production Build Locally

```bash
npm run preview
```

Visit `http://localhost:4173` and test functionality.

---

## Web Deployment

## Deploy to Netlify

### Option 1: Drag & Drop (Easiest)

1. Go to [Netlify](https://www.netlify.com)
2. Sign up/Log in
3. Click "Add new site" → "Deploy manually"
4. Drag and drop your `dist/` folder
5. Once deployed, click "Site configuration" → "Environment variables"
6. Add environment variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
7. Go to "Deploys" and click "Trigger deploy"

### Option 2: Git Integration (Recommended)

1. Push your code to GitHub/GitLab
2. Go to Netlify and click "Add new site" → "Import from Git"
3. Choose your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add environment variables (same as Option 1)
6. Click "Deploy site"

### Option 3: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

### Configure Redirects

Create `public/_redirects` file:

```
/*    /index.html   200
```

This ensures client-side routing works correctly.

### Custom Domain (Optional)

1. Go to "Site configuration" → "Domain management"
2. Click "Add custom domain"
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic, ~24 hours)

---

## Deploy to Vercel

### Option 1: Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Follow prompts to configure deployment.

### Option 2: Git Integration

1. Push code to GitHub/GitLab
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click "Add New" → "Project"
4. Import your repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click "Deploy"

### Configure Rewrites

Vercel auto-detects Vite apps and configures routing automatically. No additional configuration needed!

### Custom Domain

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL is automatic

---

## Deploy to Railway

### Step-by-Step

1. Go to [Railway](https://railway.app)
2. Sign up/Log in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway auto-detects Vite
6. Add environment variables:
   - Click "Variables" tab
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
7. Deploy happens automatically

### Configure Port (if needed)

Railway automatically detects the port. No configuration needed for Vite apps.

---

## Mobile App (APK Conversion)

### Method 1: Capacitor (Recommended for Full Features)

#### Prerequisites

```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Install Java Development Kit (JDK) 11+
# Verify with: java -version
```

#### Step 1: Install Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
```

#### Step 2: Initialize Capacitor

```bash
npx cap init

# Enter details:
# App name: Finance Tracker
# App ID: com.financetracker.app (reverse domain notation)
# Web asset directory: dist
```

This creates `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.financetracker.app',
  appName: 'Finance Tracker',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

#### Step 3: Build Web Assets

```bash
npm run build
```

#### Step 4: Add Android Platform

```bash
npx cap add android
```

This creates an `android/` directory with the native Android project.

#### Step 5: Sync Files

```bash
npx cap sync
```

This copies your web assets to the Android project.

#### Step 6: Open in Android Studio

```bash
npx cap open android
```

Android Studio will open with your project.

#### Step 7: Build APK in Android Studio

1. In Android Studio, click **Build** → **Generate Signed Bundle / APK**
2. Select **APK** and click **Next**
3. Create a new keystore or use existing:
   - **Key store path**: Choose location (e.g., `~/keystore.jks`)
   - **Password**: Create secure password
   - **Key alias**: `finance-tracker`
   - **Key password**: Same or different password
4. Click **Next**
5. Select **release** build variant
6. Click **Finish**

APK will be in: `android/app/release/app-release.apk`

#### Step 8: Install APK on Device

**Option A: Via USB**
```bash
adb install android/app/release/app-release.apk
```

**Option B: Manual Transfer**
1. Copy APK to your phone (via USB, email, or cloud)
2. On phone, open the APK file
3. Allow installation from unknown sources if prompted
4. Install the app

### Method 2: PWA Builder (Easier, Limited Features)

#### Step 1: Deploy Your App

First, deploy your app to a public URL (use Netlify/Vercel steps above).

#### Step 2: Ensure PWA Manifest

Your app already has `public/manifest.json` and service worker configured.

#### Step 3: Generate APK Online

**Option A: PWABuilder.com**
1. Go to [PWABuilder.com](https://www.pwabuilder.com)
2. Enter your deployed URL (e.g., `https://your-app.netlify.app`)
3. Click "Start"
4. Wait for analysis to complete
5. Click "Package" → "Android"
6. Choose "Trusted Web Activity" (TWA)
7. Configure:
   - **Package ID**: `com.financetracker.app`
   - **App name**: Finance Tracker
   - **Display mode**: Fullscreen
   - **Icon URL**: (use your logo)
8. Click "Generate"
9. Download the APK

**Option B: Bubblewrap CLI**
```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize
bubblewrap init --manifest https://your-app.netlify.app/manifest.json

# Build APK
bubblewrap build

# Output: app-release-signed.apk
```

### Comparison: Capacitor vs PWA Builder

| Feature | Capacitor | PWA Builder |
|---------|-----------|-------------|
| Native plugins | ✅ Yes | ❌ No |
| Camera access | ✅ Yes | ⚠️ Limited |
| File system | ✅ Full access | ⚠️ Limited |
| Offline support | ✅ Full | ✅ Full |
| Setup complexity | ⚠️ Medium | ✅ Easy |
| App size | ⚠️ Larger (~15MB) | ✅ Smaller (~2MB) |
| Google Play | ✅ Full support | ✅ Full support |

**Recommendation**: Use Capacitor for production apps, PWA Builder for quick testing.

---

## Post-Deployment Checklist

After deploying, verify these critical functions:

### Functionality Tests

- [ ] **Homepage loads correctly**
  - No 404 errors
  - Assets load (CSS, JS, images)

- [ ] **Authentication works**
  - Sign up with new account
  - Receive verification email
  - Verify email and login
  - Logout and login again

- [ ] **Database operations**
  - Add new transaction
  - Edit transaction
  - Delete transaction
  - View transaction history

- [ ] **Categories**
  - See default categories
  - Create custom category
  - Use custom category in transaction

- [ ] **Kasbon management**
  - Add new kasbon
  - Mark kasbon as paid
  - Verify paid_date is set

- [ ] **Settings**
  - Change theme (dark/light)
  - Change language (EN/ID)
  - Change currency (USD/IDR)
  - Verify settings persist after refresh

- [ ] **Profile management**
  - Click profile in sidebar → goes to Settings > Profile (not Preferences)
  - Edit profile information
  - Upload avatar image
  - Verify avatar displays in sidebar

- [ ] **Reports & Charts**
  - View monthly reports
  - Click on chart bars
  - Filter by date range
  - Export to Excel/Image

### Performance Tests

- [ ] **Page load time** < 3 seconds
- [ ] **Time to interactive** < 5 seconds
- [ ] **Lighthouse score** > 80 (run in Chrome DevTools)
- [ ] **Mobile responsive** (test on actual device)

### Security Tests

- [ ] **Environment variables** not exposed in client bundle
- [ ] **RLS policies** prevent unauthorized access
- [ ] **User data isolated** (create 2 accounts, verify data separation)
- [ ] **HTTPS enabled** (check for padlock in browser)

---

## Troubleshooting

### Deployment Fails

**Issue**: Build fails with module errors
```
Solution:
1. Delete node_modules and package-lock.json
2. Run: npm install
3. Run: npm run build
4. Try deploying again
```

**Issue**: Environment variables not working
```
Solution:
1. Verify variable names start with VITE_
2. Rebuild after adding variables
3. Check deployment logs for errors
4. Clear browser cache and test again
```

### App Doesn't Load

**Issue**: Blank page after deployment
```
Solution:
1. Open browser console (F12)
2. Look for errors (usually CORS or 404)
3. Check network tab for failed requests
4. Verify Supabase URL is correct
5. Check if _redirects or vercel.json configured
```

**Issue**: 404 on page refresh
```
Solution:
Add redirect rules:

Netlify: _redirects file
/*    /index.html   200

Vercel: vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Database Issues

**Issue**: "relation does not exist" error
```
Solution:
1. Go to Supabase Dashboard → SQL Editor
2. Run COMPLETE_DATABASE_SETUP.sql again
3. Verify tables created
```

**Issue**: User can't access data (RLS error)
```
Solution:
1. Check user is authenticated
2. Verify RLS policies in Supabase Dashboard
3. Test query in SQL Editor with auth.uid()
```

### APK Issues

**Issue**: APK won't install on device
```
Solution:
1. Enable "Install from unknown sources" in phone settings
2. Check APK is signed (for release builds)
3. Verify Android version compatibility (min SDK 21)
```

**Issue**: App shows blank screen on mobile
```
Solution:
1. Check browser console in Android Studio (Logcat)
2. Verify API URLs are accessible from mobile network
3. Test PWA version in mobile browser first
4. Check CORS settings in Supabase
```

### Performance Issues

**Issue**: App loads slowly
```
Solution:
1. Enable gzip compression on hosting platform
2. Use build.rollupOptions.output.manualChunks in vite.config.ts
3. Optimize images (use WebP format)
4. Enable CDN (Cloudflare)
5. Check database query performance in Supabase
```

---

## Monitoring & Maintenance

### Analytics (Optional)

Add Google Analytics or Plausible:

```typescript
// In src/main.tsx
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');
ReactGA.send('pageview');
```

### Error Tracking (Optional)

Add Sentry for error monitoring:

```bash
npm install @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### Backup Database

Supabase automatic backups:
- **Free tier**: Daily backups (7 days retention)
- **Pro tier**: Daily backups (30 days retention)

Manual backup:
1. Supabase Dashboard → Database → Backups
2. Click "Download backup"

---

## Scaling Considerations

### When to Upgrade Supabase Plan

Free tier limits:
- 500 MB database size
- 1 GB file storage
- 2 GB bandwidth/month
- 50,000 monthly active users

Upgrade to Pro ($25/month) when:
- Database > 400 MB
- Monthly users > 40,000
- Need daily backups
- Need priority support

### CDN for Assets

Use Cloudflare for:
- Image optimization
- Global caching
- DDoS protection
- Free tier available

### Database Optimization

Monitor query performance:
1. Supabase Dashboard → Database → Query Performance
2. Add indexes for slow queries
3. Use database connection pooling
4. Consider read replicas for high traffic

---

## Support & Resources

- **Documentation**: See README.md and API_DOCUMENTATION.md
- **Database Setup**: COMPLETE_DATABASE_SETUP.sql
- **Issues**: Report bugs on GitHub Issues
- **Email**: andreanwar713@gmail.com

---

**Version**: 3.1.0
**Last Updated**: December 4, 2025
**Status**: Production Ready ✅
