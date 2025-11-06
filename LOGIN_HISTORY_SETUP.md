# Login History Feature - Complete Setup

## Overview
The login history feature tracks user login and logout times with exact date and time stamps.

## Database Migrations to Apply

Run these migrations in order in your Supabase SQL Editor:

### 1. Create login_history table (if not exists)
File: `supabase/migrations/20251020165123_add_login_history_table.sql`

### 2. Add DELETE policy
File: `supabase/migrations/20251020165124_add_delete_policy_login_history.sql`

### 3. Add logout_timestamp column
File: `supabase/migrations/20251020165125_update_login_history_with_logout.sql`

### 4. Add UPDATE policy
File: `supabase/migrations/20251020165126_add_update_policy_login_history.sql`

## Features

### Automatic Tracking
- ✅ Login time recorded automatically when user signs in
- ✅ Logout time recorded when user clicks logout button
- ✅ Session duration calculated automatically

### Login History Page
- **Route**: `/login-history`
- **Access**: Click "History" button in navigation bar
- **Displays**:
  - Login Date & Time (exact timestamp)
  - Logout Date & Time (exact timestamp)
  - Session Duration (in minutes)
  - Login Method (email/google)
  - Status (Success/Failed)

### Clear History
- Users can permanently delete their login history
- Confirmation dialog before deletion
- Data is permanently removed from database

## How It Works

1. **Login**: When user signs in, a record is created in `login_history` table with:
   - `user_id`
   - `login_timestamp` (exact date & time)
   - `user_agent` (browser info)
   - `login_method` (email/google)
   - `success` (true/false)

2. **Logout**: When user clicks logout, the system:
   - Finds the most recent active session (no logout_timestamp)
   - Updates the record with `logout_timestamp` (exact date & time)

3. **Display**: The page shows:
   - Login time: Date and time in local format
   - Logout time: Date and time in local format (or "Active" if still logged in)
   - Duration: Calculated in minutes

## Testing

1. Login to your account
2. Navigate to History page
3. You should see your current session with "Active" status
4. Logout and login again
5. Check History - you should see the logout time for previous session
6. Test "Clear History" button to permanently delete records

## Files Modified

- `src/pages/LoginHistory.tsx` - Updated to show login/logout times
- `src/hooks/useAuth.tsx` - Added logout tracking
- `src/App.tsx` - Route already configured
- `src/components/layout/DashboardLayout.tsx` - Navigation button already present
- Database migrations created for schema updates
