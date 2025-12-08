# Changelog Entry for v4.1.0

**ADD THIS TO THE TOP OF CHANGELOG.md (AFTER LINE 7, BEFORE v4.0.0)**

```markdown
## [4.1.0] - 2025-12-08

### MAJOR UPDATE: Profile Management & Navigation Improvements

This release introduces a complete user profile management system with avatar upload,
improved navigation architecture, and critical bug fixes for new user experience.

### Added

#### Profile Management System (NEW!)
- **ProfileManager Component**: Complete profile editor with avatar upload
  - Upload profile photo (max 2MB, JPG/PNG/WEBP supported)
  - Edit full name, phone number, and bio
  - Real-time validation and error handling
  - Secure storage using Supabase Storage
  - Automatic avatar cleanup on update

- **Avatar Display in Sidebar**: Live avatar preview
  - Shows uploaded photo or initials fallback
  - Real-time sync across application
  - Clickable to open profile settings
  - Smooth hover effects

- **Database Table**: `user_profiles`
  - Stores full_name, avatar_url, phone, bio
  - Row Level Security enabled
  - One-to-one relationship with auth.users
  - Automatic timestamp tracking

- **Storage Bucket**: `avatars`
  - Public bucket for profile photos
  - User-specific folders (user_id/)
  - RLS policies for secure access
  - Auto-cleanup of old avatars

#### Navigation Enhancements
- **Parameter Passing**: MainLayout now supports `viewParams` object
  - Pass data between views (e.g., `{ openTab: 'profile' }`)
  - Type-safe parameter handling
  - Clean architecture for deep linking

- **Tab-based Settings**: Two-tab system in Settings
  - Preferences tab: Theme, Language, Currency
  - Profile tab: User profile management
  - URL-like navigation with openTab param
  - Smooth tab transitions

- **Direct Profile Access**: One-click navigation
  - Click avatar in sidebar → Profile tab opens
  - Event-driven architecture
  - No page reload required

#### Bug Fixes (Critical)
- **Fixed: Reports Infinite Loading for New Users**
  - Root cause: Loading state not distinguishing initial load vs empty data
  - Solution: Added `initialLoadComplete` state flag
  - Added beautiful empty state UI with onboarding
  - Provides "Tambah Transaksi" button for quick start
  - Shows helpful tips for income vs expense

### Changed

#### Component Updates
- **MainLayout.tsx**
  - Added `viewParams` state for parameter passing
  - Updated `handleViewChange` to accept params
  - Pass openTab to Settings component

- **Sidebar.tsx**
  - Avatar section now clickable
  - Loads avatar from user_profiles table
  - Listens for `profile-updated` custom event
  - Real-time avatar sync after upload
  - Added User icon indicator for clickability

- **Settings.tsx**
  - Accepts `openTab` prop for tab control
  - useEffect to set active tab based on prop
  - Deterministic tab switching (no race conditions)
  - Version updated to 4.1.0 in About section

- **Charts.tsx**
  - Added `initialLoadComplete` state
  - Improved loading condition logic
  - New empty state component with helpful onboarding
  - Set flag in finally block

#### Documentation
- Updated README.md with profile features
- Comprehensive bug fix documentation
- Migration consolidation guide
- Deployment instructions updated

### Technical Details

#### Event System
Custom event for avatar synchronization:
```typescript
// ProfileManager dispatches after upload
window.dispatchEvent(new CustomEvent('profile-updated'));

// Sidebar listens and reloads
window.addEventListener('profile-updated', handleProfileUpdate);
```

#### Parameter Navigation Pattern
```typescript
// Sidebar triggers navigation with params
onViewChange('settings', { openTab: 'profile' });

// MainLayout passes to component
<Settings openTab={viewParams?.openTab} />

// Settings reacts to prop
useEffect(() => {
  if (openTab === 'profile') setActiveTab('profile');
}, [openTab]);
```

### Database Changes

#### New Table: user_profiles
```sql
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE REFERENCES auth.users(id),
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### New Storage Bucket: avatars
- Public read access
- Authenticated users can upload to own folder
- RLS policies enforce folder-level permissions

#### Consolidated Migration
- New `migrations.sql` file with ALL tables
- Single-command database setup
- Includes verification queries
- Idempotent with IF NOT EXISTS checks

### Security

#### Profile Data Protection
- RLS policies: Users can only view/edit own profile
- Avatar storage: Folder-based isolation by user_id
- Image validation: Type and size checks client-side
- Secure URLs: Public but unpredictable paths

### Performance

#### Optimizations
- Avatar lazy loading in sidebar
- Event-driven updates (no polling)
- Efficient RLS queries with indexed user_id

### Migration Notes

#### From v3.x to v4.1
1. Deploy updated components (MainLayout, Sidebar, Settings)
2. Deploy new ProfileManager component
3. Run migrations.sql OR apply user_profiles migration
4. Create avatars storage bucket
5. Test profile upload and navigation
6. Verify avatar sync works

#### Breaking Changes
None. Fully backward compatible.

---
```
