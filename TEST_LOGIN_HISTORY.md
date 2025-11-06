# Testing Login History Feature

## Step 1: Run the Fix SQL Script
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `FIX_LOGIN_HISTORY.sql`
4. Click "Run" to execute
5. Check the results to see if:
   - The `logout_timestamp` column exists
   - Any existing login records are shown
   - RLS policies are properly configured

## Step 2: Test in Browser Console
After logging in, open browser console (F12) and run:

```javascript
// Check if login was recorded
const { data, error } = await window.supabase
  .from('login_history')
  .select('*')
  .order('login_timestamp', { ascending: false })
  .limit(5);

console.log('Login History:', data);
console.log('Error:', error);
```

## Step 3: Manual Insert Test
In Supabase SQL Editor, try manually inserting a test record:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Insert a test login record (replace USER_ID with your actual user ID)
INSERT INTO login_history (user_id, login_timestamp, login_method, success)
VALUES ('USER_ID', NOW(), 'email', true);

-- Check if it appears
SELECT * FROM login_history ORDER BY login_timestamp DESC LIMIT 5;
```

## Step 4: Check RLS Policies
Make sure you can read your own records:

```sql
-- This should return your records
SELECT * FROM login_history WHERE user_id = auth.uid();
```

## Expected Results
- You should see login records in the database
- The `/login-history` page should display your login/logout times
- Each login should create a new record
- Each logout should update the logout_timestamp

## Common Issues

### Issue 1: No records showing
**Cause**: Login tracking not firing
**Fix**: Check browser console for errors when logging in

### Issue 2: Records exist but page is empty
**Cause**: RLS policy blocking access
**Fix**: Run the policy check in FIX_LOGIN_HISTORY.sql

### Issue 3: Logout timestamp not updating
**Cause**: Update policy missing
**Fix**: Run this SQL:
```sql
CREATE POLICY IF NOT EXISTS "Users can update their own login history" 
ON login_history FOR UPDATE 
USING (auth.uid() = user_id);
```
