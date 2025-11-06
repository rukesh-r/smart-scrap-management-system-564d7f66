-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view available scrap items" ON public.scrap_items;
DROP POLICY IF EXISTS "Customers can view their own scrap items" ON public.scrap_items;
DROP POLICY IF EXISTS "Buyers can update scrap items when purchasing" ON public.scrap_items;

-- Allow viewing available items
CREATE POLICY "Anyone can view available scrap items" 
ON public.scrap_items 
FOR SELECT 
USING (status = 'available');

-- Allow customers to view their own items
CREATE POLICY "Customers can view their own scrap items" 
ON public.scrap_items 
FOR SELECT 
USING (auth.uid() = customer_id);

-- Allow buyers to view items they have transactions for
CREATE POLICY "Buyers can view purchased items"
ON public.scrap_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.scrap_item_id = id
    AND t.buyer_id = auth.uid()
  )
);

-- Allow buyers to update items they have transactions for
CREATE POLICY "Buyers can update purchased items"
ON public.scrap_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.scrap_item_id = id
    AND t.buyer_id = auth.uid()
  )
);
