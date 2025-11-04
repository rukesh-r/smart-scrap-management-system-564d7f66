-- Add GPS columns to scrap_items table
ALTER TABLE scrap_items
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Add index for GPS queries
CREATE INDEX IF NOT EXISTS idx_scrap_items_location ON scrap_items(location_lat, location_lng);
