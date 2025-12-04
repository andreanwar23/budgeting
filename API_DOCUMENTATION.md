# API Documentation - BU Finance Tracker

## Overview

This application uses **Supabase** as the backend, which provides a RESTful API automatically generated from your PostgreSQL database schema. All API calls go through the Supabase client library.

**Base URL**: `https://[your-project-ref].supabase.co/rest/v1/`

## Authentication

All API requests require authentication using Supabase Auth.

```typescript
// Authentication is handled automatically by the Supabase client
import { supabase } from './lib/supabase';

// User is authenticated via JWT token stored in local storage
const { data: { user } } = await supabase.auth.getUser();
```

## API Endpoints

### 1. Categories

#### GET /categories
Retrieve all categories (default + user-created)

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .or(`is_default.eq.true,user_id.eq.${userId}`);
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid | null",
    "name": "Gaji",
    "type": "income",
    "is_default": true,
    "icon": "banknote",
    "created_at": "2025-12-04T10:00:00Z",
    "updated_at": "2025-12-04T10:00:00Z"
  }
]
```

#### POST /categories
Create a new custom category

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .insert([{
    user_id: userId,
    name: 'Custom Category',
    type: 'expense',
    icon: 'shopping-cart',
    is_default: false
  }])
  .select()
  .single();
```

#### PUT /categories
Update an existing category

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('categories')
  .update({ name: 'Updated Name', icon: 'new-icon' })
  .eq('id', categoryId)
  .eq('user_id', userId);
```

#### DELETE /categories
Delete a user-created category

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('categories')
  .delete()
  .eq('id', categoryId)
  .eq('user_id', userId);
```

**Security**: Users can only create/update/delete their own categories, not default ones.

---

### 2. Transactions

#### GET /transactions
Retrieve user's transactions

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    *,
    category:categories(*)
  `)
  .eq('user_id', userId)
  .order('transaction_date', { ascending: false });
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "amount": 50000,
    "type": "expense",
    "category_id": "uuid",
    "title": "Lunch",
    "description": "Lunch at restaurant",
    "transaction_date": "2025-12-04",
    "created_at": "2025-12-04T10:00:00Z",
    "updated_at": "2025-12-04T10:00:00Z",
    "category": {
      "id": "uuid",
      "name": "Makanan",
      "type": "expense",
      "icon": "utensils"
    }
  }
]
```

#### POST /transactions
Create a new transaction

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('transactions')
  .insert([{
    user_id: userId,
    title: 'Monthly Salary',
    amount: 5000000,
    type: 'income',
    category_id: categoryId,
    description: 'December salary',
    transaction_date: '2025-12-04'
  }])
  .select()
  .single();
```

#### PUT /transactions
Update a transaction

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('transactions')
  .update({
    title: 'Updated Title',
    amount: 60000,
    description: 'Updated description'
  })
  .eq('id', transactionId)
  .eq('user_id', userId);
```

#### DELETE /transactions
Delete a transaction

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId)
  .eq('user_id', userId);
```

---

### 3. Kasbon (Loans)

#### GET /kasbon
Retrieve user's loan records

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('kasbon')
  .select('*')
  .eq('user_id', userId)
  .order('loan_date', { ascending: false });
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "John Doe",
    "amount": 1000000,
    "loan_date": "2025-12-01",
    "status": "unpaid",
    "due_date": "2025-12-31",
    "paid_date": null,
    "notes": "Emergency loan",
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-01T10:00:00Z"
  }
]
```

#### POST /kasbon
Create a new loan record

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('kasbon')
  .insert([{
    user_id: userId,
    name: 'Jane Smith',
    amount: 500000,
    loan_date: '2025-12-04',
    status: 'unpaid',
    notes: 'Short term loan'
  }])
  .select()
  .single();
```

#### PUT /kasbon
Update a loan record (e.g., mark as paid)

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('kasbon')
  .update({
    status: 'paid',
    paid_date: new Date().toISOString()
  })
  .eq('id', kasbonId)
  .eq('user_id', userId);
```

**Note**: The `paid_date` is automatically set to current timestamp when status changes to 'paid'.

---

### 4. User Settings

#### GET /user_settings
Retrieve user's settings

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('user_settings')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "language": "id",
  "currency": "IDR",
  "theme": "dark",
  "created_at": "2025-12-04T10:00:00Z",
  "updated_at": "2025-12-04T10:00:00Z"
}
```

#### POST /user_settings
Create user settings (on first login)

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('user_settings')
  .insert([{
    user_id: userId,
    language: 'id',
    currency: 'IDR',
    theme: 'light'
  }])
  .select()
  .single();
```

#### PUT /user_settings
Update user settings

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('user_settings')
  .update({
    theme: 'dark',
    language: 'en',
    currency: 'USD'
  })
  .eq('user_id', userId);
```

---

### 5. User Profiles

#### GET /user_profiles
Retrieve user's profile

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "full_name": "John Doe",
  "avatar_url": "https://[project].supabase.co/storage/v1/object/public/avatars/[userid]/avatar.jpg",
  "phone": "08123456789",
  "bio": "Finance enthusiast",
  "created_at": "2025-12-04T10:00:00Z",
  "updated_at": "2025-12-04T10:00:00Z"
}
```

#### POST /user_profiles
Create user profile (on first access to profile page)

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .insert([{
    user_id: userId,
    full_name: 'John Doe',
    phone: '08123456789',
    bio: 'My bio'
  }])
  .select()
  .single();
```

#### PUT /user_profiles
Update user profile

**Supabase Query:**
```typescript
const { error } = await supabase
  .from('user_profiles')
  .update({
    full_name: 'Jane Doe',
    phone: '08198765432',
    bio: 'Updated bio'
  })
  .eq('user_id', userId);
```

---

## Storage API

### Avatar Upload

Upload profile avatar to Supabase Storage

**Upload:**
```typescript
const file = event.target.files[0];
const fileName = `${userId}/avatar.${fileExt}`;

const { error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, { upsert: true });
```

**Get Public URL:**
```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(fileName);

const avatarUrl = data.publicUrl;
```

**Delete Avatar:**
```typescript
const { error } = await supabase.storage
  .from('avatars')
  .remove([`${userId}/avatar.jpg`]);
```

**Security**: Users can only upload/update/delete avatars in their own folder (`${userId}/`).

---

## Error Handling

All Supabase queries return an object with `data` and `error`:

```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*');

if (error) {
  console.error('Error:', error.message);
  // Handle error (show toast, etc.)
} else {
  console.log('Data:', data);
  // Use data
}
```

**Common Errors:**

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `relation "table" does not exist` | Table not created | Run database migrations |
| `permission denied for table` | RLS policy violation | Ensure user is authenticated |
| `duplicate key value violates unique constraint` | Inserting duplicate | Check unique fields |
| `null value in column violates not-null constraint` | Missing required field | Provide all required fields |

---

## Rate Limiting

Supabase has default rate limits:
- **Free tier**: 500 requests per second
- **Pro tier**: 10,000 requests per second

For most use cases, this is more than sufficient.

---

## Best Practices

### 1. Always Check for Errors
```typescript
const { data, error } = await supabase.from('transactions').select('*');
if (error) {
  // Handle error
  return;
}
// Use data
```

### 2. Use `.maybeSingle()` for Single Row Queries
```typescript
// Use maybeSingle() instead of single() to avoid errors when no row found
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle(); // Returns null if not found (no error)
```

### 3. Always Filter by User ID
```typescript
// Ensures users only access their own data
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId); // Critical for security
```

### 4. Use Indexes for Performance
All tables have indexes on frequently queried columns. See `COMPLETE_DATABASE_SETUP.sql` for index definitions.

### 5. Batch Operations When Possible
```typescript
// Insert multiple transactions at once
const { error } = await supabase
  .from('transactions')
  .insert([
    { user_id: userId, title: 'Transaction 1', amount: 100, type: 'expense', category_id: cat1 },
    { user_id: userId, title: 'Transaction 2', amount: 200, type: 'income', category_id: cat2 }
  ]);
```

---

## Real-time Subscriptions (Optional)

Supabase supports real-time updates:

```typescript
const subscription = supabase
  .channel('transactions-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Change received!', payload);
      // Refresh data
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

---

## Testing API Endpoints

### Using Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Select a table
3. Click "Insert row" / "Edit row" / "Delete row"
4. Verify RLS policies are working

### Using Browser Console

```javascript
// Test from browser console (must be logged in)
const { data, error } = await window.supabase
  .from('transactions')
  .select('*');

console.log(data, error);
```

### Using Postman

```bash
curl -X GET 'https://[your-project].supabase.co/rest/v1/transactions' \
  -H "apikey: [your-anon-key]" \
  -H "Authorization: Bearer [user-jwt-token]"
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled. Users can ONLY:
- View their own data
- Create their own data
- Update their own data
- Delete their own data

Exception: Default categories are visible to all users but cannot be modified.

### Authentication

All API requests automatically include:
- JWT token in Authorization header
- User ID from `auth.uid()`

No need to manually pass user ID in requests - Supabase handles this automatically via RLS policies.

---

## Troubleshooting

### Profile Navigation Issue (FIXED)
**Problem**: Clicking profile navigated to Settings > Preferences instead of Settings > Profile.

**Solution**: Implemented event-based navigation system:
- Sidebar dispatches `navigate-to-profile` custom event
- Settings component listens and switches to profile tab
- Location: `src/components/Sidebar.tsx` and `src/components/Settings.tsx`

### API Not Responding
1. Check network tab in browser DevTools
2. Verify Supabase credentials in `.env`
3. Check RLS policies in Supabase Dashboard
4. Ensure user is authenticated

### Data Not Updating
1. Check for error messages in console
2. Verify all required fields are provided
3. Ensure proper user permissions via RLS
4. Check network request/response in DevTools

---

## Further Reading

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)

---

**Version**: 3.1.0
**Last Updated**: December 4, 2025
**Maintained by**: BU Finance Tracker Team
