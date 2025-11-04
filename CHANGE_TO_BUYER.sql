-- Change your role to buyer (replace 'your-email@example.com' with your actual email)
UPDATE profiles 
SET role = 'buyer' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);
