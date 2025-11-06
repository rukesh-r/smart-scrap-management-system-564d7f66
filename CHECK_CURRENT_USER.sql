-- Check your current user ID
SELECT id, email FROM auth.users WHERE email = (SELECT email FROM auth.users LIMIT 1);

-- Check all login history for your user
SELECT 
    id,
    user_id,
    login_timestamp,
    logout_timestamp,
    login_method,
    success
FROM login_history
WHERE user_id = auth.uid()
ORDER BY login_timestamp DESC;
