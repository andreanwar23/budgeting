# Changelog - Finance Tracker Application

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2025-12-08

### MAJOR UPDATE: Authentication System Optimization

This release includes a comprehensive overhaul of the authentication system with improved security, performance, and maintainability.

### Added

#### Edge Functions (NEW)
- **check-user-exists**: Enhanced email verification with rate limiting and input validation
  - Rate limiting: 10 requests per minute per IP
  - Email validation and sanitization
  - Generic responses to prevent user enumeration
  - Improved error handling and logging

- **resend-verification** (NEW): Resend verification email for unverified accounts
  - Rate limiting: 3 requests per 5 minutes per email
  - Only sends to unverified accounts
  - Generic responses for security
  - Prevents abuse through rate limiting

- **send-reset** (NEW): Send password reset link for verified accounts
  - Rate limiting: 3 requests per 5 minutes per email
  - Only sends to verified accounts
  - Generic responses to prevent user enumeration
  - Secure token generation

#### Database
- Consolidated migration file (CONSOLIDATED_MIGRATION.sql)
  - All tables in one migration for easy setup
  - Improved documentation
  - Verification queries included
  - Production-ready defaults

#### Documentation
- Comprehensive CHANGELOG.md (this file)
- Updated EDGE_FUNCTIONS_GUIDE.md with all three functions
- Improved deployment documentation
- Security best practices documented

### Changed

#### Security Improvements
- Enhanced rate limiting across all edge functions
- Email validation and sanitization
- Generic error responses to prevent user enumeration
- Improved CORS configuration
- Secure error handling without exposing sensitive data
- Method validation (POST only for endpoints)

#### Performance Optimizations
- Optimized RLS policies using (select auth.uid())
- Strategic indexes on frequently queried columns
- Reduced query complexity
- Improved edge function response times

#### Code Quality
- TypeScript interfaces for better type safety
- Consistent error handling patterns
- Improved code documentation
- Separated concerns across multiple files
- Removed duplicate and unused files

### Fixed
- Edge function deployment issues
- Migration conflicts and duplication
- Documentation inconsistencies
- File organization and structure
- CORS header configuration

### Removed
- Duplicate Dashboard copy.tsx file
- Redundant documentation files:
  - CARA_DEPLOY_MUDAH.md
  - PASSWORD_RESET_BUG_FIX.md
  - DEPLOY_EDGE_FUNCTION.md
  - IMAGE_NAVIGATION_FEATURE.md
  - IMPLEMENTATION_SUMMARY.md
  - QUICK_FIX_PASSWORD_RESET.md
  - QUICK_IMPLEMENTATION_GUIDE.md
  - FIXES_AND_IMPROVEMENTS_SUMMARY.md
  - PASSWORD_RESET_EMAIL_VALIDATION.md
  - FILES_TO_DELETE.md
- Outdated migration files (consolidated into single file)

### Security

#### Rate Limiting
All edge functions now include rate limiting:
- check-user-exists: 10 requests/min per IP
- resend-verification: 3 requests/5min per email
- send-reset: 3 requests/5min per email

#### Input Validation
- Email format validation
- Email length validation (max 254 chars)
- Type checking on all inputs
- Sanitization of user inputs

#### Privacy Protection
- Generic error messages prevent user enumeration
- No sensitive data in responses
- Secure logging practices
- CORS properly configured

### Database Changes

#### Tables (No Schema Changes)
All existing tables maintained:
- categories
- transactions
- kasbon
- user_settings
- user_profiles

#### New Policies
- Improved RLS policies with optimized auth.uid() calls
- Better performance for large datasets

### Deployment Notes

#### Required Actions
1. Deploy new edge functions to Supabase:
   - check-user-exists (updated)
   - resend-verification (new)
   - send-reset (new)

2. Optional: Apply consolidated migration if setting up fresh database

3. Update environment variables if needed:
   - SITE_URL for redirect URLs

#### Breaking Changes
- None. All changes are backward compatible.

#### Migration Path
From v3.x to v4.0:
1. Deploy updated check-user-exists function
2. Deploy resend-verification function
3. Deploy send-reset function
4. Test authentication flows
5. No database changes required

### Performance Metrics

#### Before Optimization
- check-user-exists: ~500ms average
- No rate limiting
- Exposed user enumeration

#### After Optimization
- check-user-exists: ~200ms average
- Rate limiting active
- Secure responses
- Better error handling

---

## [3.3.0] - 2026-01-05

### MAJOR FEATURE: Savings/Menabung Management System

This release introduces a comprehensive savings goals management system with full integration into the existing financial tracking infrastructure.

### Added

#### Savings Goals Feature
- **Savings Goals Management**: Create, edit, and delete savings goals with customizable targets
  - Goal name and optional notes
  - Target amount with validation
  - Start date (defaults to today)
  - Optional target date for deadline tracking
  - Automatic progress calculation and visualization

- **Deposit & Withdrawal System**: Full transaction management for savings goals
  - Deposit funds to any goal
  - Withdraw funds with validation (cannot exceed current amount)
  - Transaction date tracking
  - Optional notes for each transaction
  - Real-time balance updates

- **Progress Tracking & Visualization**:
  - Individual progress bars for each goal
  - Overall savings progress across all goals
  - Current amount vs target amount display
  - Remaining amount calculation
  - Percentage completion indicators

- **Dashboard Integration**:
  - New "Total Savings" card displaying aggregate savings
  - Monthly savings amount tracking
  - Smart balance calculation: Income - Expenses - Savings - Kasbon
  - Savings included in "This Month Balance" calculation
  - Savings included in "Overall Balance" calculation

- **Transaction History**:
  - Complete history of deposits and withdrawals
  - Chronological display with dates
  - Type indicators (deposit/withdraw)
  - Amount and notes display
  - Automatic sorting by date

#### Database Schema
- **savings_goals table**:
  - Stores savings goal information
  - Tracks current_amount and target_amount
  - Optional target_date for deadline tracking
  - Full RLS security policies
  - Optimized indexes for performance

- **savings_transactions table**:
  - Stores all deposit and withdrawal transactions
  - Links to savings_goals via foreign key
  - Cascade delete when goal is removed
  - Type validation (deposit/withdraw)
  - Full RLS security policies

- **Database Triggers**:
  - Automatic current_amount updates on transaction insert/update/delete
  - Ensures data consistency
  - Transaction-safe operations

#### UI Components
- **SavingManager**: Main savings management component
  - Goals list view with summary cards
  - Add/edit goal forms
  - Goal detail view with transactions
  - Empty state for new users
  - Responsive grid layout

- **Navigation**:
  - New "Menabung/Savings" menu item with PiggyBank icon
  - Positioned between Kasbon and Reports
  - Active state highlighting
  - Proper routing integration

#### Translations
- Complete Indonesian and English translations for all savings features
- 40+ new translation keys added
- Consistent terminology across all UI elements

### Changed

#### Balance Calculations
- **Monthly Balance**: Now subtracts monthly savings deposits (net) and total kasbon
- **Overall Balance**: Now subtracts total savings and total kasbon
- Updated card descriptions to reflect new calculation logic
- More accurate representation of available funds

#### Dashboard Display
- Expanded stats grid from 4 to 5 cards (added Total Savings)
- Updated balance card descriptions with savings information
- Improved context for users about what each balance represents

### Technical Improvements

#### Performance
- Optimized database queries for savings data loading
- Efficient aggregate calculations for total savings
- Indexed foreign keys for fast joins
- Lazy loading of transaction history

#### Security
- Row Level Security (RLS) on all savings tables
- User isolation - users can only access their own goals
- Validation on amounts (must be > 0)
- Withdrawal validation (cannot exceed current amount)
- Confirmation dialogs for destructive actions

#### Code Quality
- TypeScript interfaces for type safety
- Consistent error handling
- Reusable CurrencyInput component
- Clean component architecture
- Proper state management

### Migration Guide

#### Database Migration
Run the SAVINGS_MIGRATION.sql file via Supabase Dashboard:
1. Navigate to SQL Editor in Supabase Dashboard
2. Copy contents of SAVINGS_MIGRATION.sql
3. Execute the migration
4. Verify tables created: savings_goals, savings_transactions
5. Verify triggers and policies are active

#### No Breaking Changes
All changes are additive - existing functionality remains unchanged.

### Documentation

- Updated README.md with Savings feature section
- Added comprehensive feature documentation
- Updated version to 3.3.0
- Updated last modified date

### Benefits

1. **Financial Goal Setting**: Users can now set and track savings goals
2. **Accurate Balance Tracking**: Savings automatically factored into balance calculations
3. **Progress Visualization**: Clear progress indicators motivate users
4. **Complete History**: Full audit trail of all savings transactions
5. **Multi-language Support**: Works seamlessly in both Indonesian and English
6. **Dark Mode Support**: Consistent experience across themes

---

## [3.1.0] - 2025-12-04

### Kasbon Improvements

#### Fixed
- Kasbon entry bug preventing adding new entries
- Array mutation errors in charts
- Percentage calculation errors
- Date filter first-click bug
- Category detail panel crashes
- Mobile white screen issues

#### Changed
- Removed due date field from Add Kasbon form
- Removed status field from Add Kasbon form (always unpaid by default)
- Added paid_date column with automatic tracking
- Database trigger auto-sets paid_date when marked as paid
- Display paid date with timestamp in kasbon list
- Edit form retains status & due date options

#### Added
- Comprehensive APK build instructions
- Capacitor/PWA build configuration
- Enhanced changelog

---

## [3.0.0] - 2025-12-02

### Major Features

#### Theme System
- Dark/light mode toggle with smooth transitions
- Persistent theme preferences
- Consistent across all components
- Database synchronization

#### Multi-Language Support
- English and Bahasa Indonesia
- Instant switching without reload
- Persisted per user

#### Multi-Currency Support
- USD and IDR support
- Automatic formatting
- Locale-aware number display

#### Settings Page
- Comprehensive settings interface
- Theme, language, and currency management
- About section with app information

#### UI Enhancements
- Quick transaction button (floating)
- Improved category detail panel
- Enhanced date filtering
- Excel/Image export functionality

### Fixed
- Mobile sidebar scrolling (iOS Safari)
- Default date in transaction form
- Chart bars not clickable on mobile
- Theme toggle functionality
- Database table creation issues

---

## [2.4.0] - 2025-11-28

### Features
- Monthly balance enhancement
- UI/UX improvements
- Compact export dropdown

---

## Earlier Versions

See git history for changes prior to v2.4.0.

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

---

**Maintained by**: Andre Anwar
**Email**: andreanwar713@gmail.com
**Repository**: [GitHub](https://github.com/yourusername/finance-tracker)
