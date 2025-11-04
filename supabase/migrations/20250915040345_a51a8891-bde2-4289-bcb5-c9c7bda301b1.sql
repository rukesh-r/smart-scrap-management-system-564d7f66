-- Fix security issue: Remove overly permissive buyer access to customer profiles
-- Drop the problematic policy that allows buyers to view all customer profiles with available items
DROP POLICY IF EXISTS "Buyers can view customer profiles for transactions" ON public.profiles;

-- Create a more secure policy that only allows buyers to view customer profiles 
-- when there's an actual transaction between them (not just available items)
CREATE POLICY "Buyers can view profiles only for their transactions" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'customer' 
  AND EXISTS (
    SELECT 1 
    FROM transactions t 
    WHERE t.customer_id = profiles.user_id 
    AND t.buyer_id = auth.uid()
  )
);

-- Ensure the existing policies remain intact for users viewing their own profiles
-- (These should already exist but confirming they're secure)

-- Users can view their own profile (already exists)
-- Users can update their own profile (already exists) 
-- Users can create their own profile (already exists)