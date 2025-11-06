-- Permanently remove all users from the database
DELETE FROM auth.users WHERE deleted_at IS NOT NULL;

-- Then delete all remaining users
DELETE FROM auth.users;
-- First, hard delete soft-deleted users
