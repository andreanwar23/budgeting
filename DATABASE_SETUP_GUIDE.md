# Database Setup Guide

This guide explains how to set up the complete database schema for the Budgeting Uang application.

## Quick Start

For a **fresh installation**, run the migrations in this order:

1. `supabase/migrations/20251128075532_create_core_tables.sql` - Creates categories, transactions, and kasbon tables
2. `supabase/migrations/20251128073935_create_user_settings_table.sql` - Creates user settings table
3. `supabase/migrations/20251128083233_create_user_profiles_table.sql` - Creates user profiles table
4. `SAVINGS_MIGRATION.sql` - Creates savings goals and savings transactions tables

## Database Schema Overview

### Core Tables

#### 1. categories
- Stores transaction categories (income/expense)
- Includes default categories viewable by all users
- Users can create their own custom categories

#### 2. transactions
- Stores all financial transactions
- Links to categories table
- Includes amount, type, date, title, and description

#### 3. kasbon
- Tracks loans and debts (hutang/piutang)
- Supports different statuses: paid, unpaid, partial
- Includes due dates and notes

#### 4. user_settings
- Stores user preferences
- Language, currency, theme settings
- One setting record per user

#### 5. user_profiles
- User profile information
- Full name, avatar, phone, bio
- Supports avatar uploads via Supabase Storage

#### 6. savings_goals
- Savings targets with goal amounts
- Tracks current progress vs target
- Optional target dates

#### 7. savings_transactions
- Deposits and withdrawals for savings goals
- Automatically updates savings_goals.current_amount via triggers

## Security (Row Level Security)

All tables have RLS enabled with the following policies:
- Users can only view/modify their own data
- Default categories are viewable by all authenticated users
- Storage bucket policies protect user avatars

## Applying Migrations

### Via Supabase Dashboard
1. Go to SQL Editor in your Supabase dashboard
2. Copy and paste each migration file content
3. Run them in the order listed above

### Via Supabase CLI
```bash
supabase db push
```

## Default Data

The core tables migration automatically populates default categories:

**Income Categories:**
- Gaji (Salary)
- Bonus
- Investasi (Investment)
- Bisnis (Business)
- Lainnya (Other)

**Expense Categories:**
- Makanan (Food)
- Transport
- Belanja (Shopping)
- Tagihan (Bills)
- Hiburan (Entertainment)
- Kesehatan (Health)
- Pendidikan (Education)
- Olahraga (Sports)
- Lainnya (Other)

## Storage Buckets

The `avatars` bucket is created automatically for user profile photos:
- Public read access
- Authenticated users can upload/update/delete their own avatars
- Files are organized by user ID folders

## Troubleshooting

### Migration Already Applied
If you see "already exists" errors, the migration has been applied previously. This is safe to ignore.

### RLS Blocking Access
Ensure you're authenticated and using the correct user context. All queries must be made by authenticated users.

### Foreign Key Violations
Ensure migrations are run in the correct order. Tables with foreign keys must be created after their parent tables.
