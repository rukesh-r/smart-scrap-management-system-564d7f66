-- Drop the old buyer update policy
DROP POLICY IF EXISTS "Buyers can update scrap items when purchasing" ON public.scrap_items;

-- Create new policy that allows buyers to update items they have transactions for
CREATE POLICY "Buyers can update scrap items when purchasing"
ON public.scrap_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.scrap_item_id = id
    AND t.buyer_id = auth.uid()
    AND t.status IN ('pending', 'completed')
  )
);
