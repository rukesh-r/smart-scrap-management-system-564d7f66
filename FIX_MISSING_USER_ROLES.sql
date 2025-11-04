-- Fix missing user roles by migrating from profiles table
-- Run this in your Supabase SQL Editor

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::app_role 
FROM public.profiles
WHERE user_id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;
