-- Add GPS columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gps_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION;

-- Add index for GPS queries
CREATE INDEX IF NOT EXISTS idx_profiles_gps ON profiles(gps_enabled, gps_latitude, gps_longitude);
