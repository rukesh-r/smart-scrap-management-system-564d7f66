-- Fix Login History Table
-- Run this in your Supabase SQL Editor

-- Step 1: Check if logout_timestamp column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'login_history' 
        AND column_name = 'logout_timestamp'
    ) THEN
        ALTER TABLE login_history ADD COLUMN logout_timestamp TIMESTAMP WITH TIME ZONE;
        CREATE INDEX idx_login_history_logout_timestamp ON login_history(logout_timestamp DESC);
    END IF;
END $$;

-- Step 2: Verify the table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'login_history'
ORDER BY ordinal_position;

-- Step 3: Check existing data
SELECT 
    id,
    user_id,
    login_timestamp,
    logout_timestamp,
    login_method,
    success
FROM login_history
ORDER BY login_timestamp DESC
LIMIT 10;

-- Step 4: Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'login_history';
