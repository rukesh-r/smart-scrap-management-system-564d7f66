-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Buyers can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Buyers can update scrap items when purchasing" ON public.scrap_items;

-- Recreate simple policies without recursion
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = customer_id);

CREATE POLICY "Buyers can create transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions 
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = customer_id);

-- Fix scrap_items buyer update policy to be simpler
CREATE POLICY "Buyers can update scrap items when purchasing"
ON public.scrap_items
FOR UPDATE
USING (status = 'available');
