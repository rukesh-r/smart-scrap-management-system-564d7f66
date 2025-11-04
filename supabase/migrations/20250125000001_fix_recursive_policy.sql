-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Buyers can view customer profiles for transactions" ON public.profiles;

-- Create a simpler policy without recursion
CREATE POLICY "Buyers can view customer profiles for transactions"
ON public.profiles
FOR SELECT
USING (
  role = 'customer'
);
