-- Create login_history table to track user login activity
CREATE TABLE login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  location_info JSONB,
  login_method TEXT DEFAULT 'email', -- email, google, etc.
  success BOOLEAN DEFAULT TRUE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_timestamp ON login_history(login_timestamp DESC);
CREATE INDEX idx_login_history_success ON login_history(success);

-- Enable RLS
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own login history
CREATE POLICY "Users can view their own login history" ON login_history
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow system to insert login records
CREATE POLICY "System can insert login history" ON login_history
  FOR INSERT WITH CHECK (true);

-- Create function to log login attempts
CREATE OR REPLACE FUNCTION log_user_login(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT NULL,
  p_location_info JSONB DEFAULT NULL,
  p_login_method TEXT DEFAULT 'email',
  p_success BOOLEAN DEFAULT TRUE,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO login_history (
    user_id,
    ip_address,
    user_agent,
    device_info,
    location_info,
    login_method,
    success,
    failure_reason
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_device_info,
    p_location_info,
    p_login_method,
    p_success,
    p_failure_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
