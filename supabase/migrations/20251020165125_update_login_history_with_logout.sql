-- Add logout_timestamp column to login_history table
ALTER TABLE login_history ADD COLUMN IF NOT EXISTS logout_timestamp TIMESTAMP WITH TIME ZONE;

-- Create index for logout timestamp
CREATE INDEX IF NOT EXISTS idx_login_history_logout_timestamp ON login_history(logout_timestamp DESC);
