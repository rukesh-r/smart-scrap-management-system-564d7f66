-- Check current site URL
SELECT * FROM auth.config;

-- Update site URL to your current localhost port
UPDATE auth.config 
SET site_url = 'http://localhost:5173'
WHERE id = 1;
