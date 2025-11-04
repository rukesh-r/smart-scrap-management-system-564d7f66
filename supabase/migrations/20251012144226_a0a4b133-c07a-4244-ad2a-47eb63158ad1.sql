-- Add policy for buyers to view scrap items they have offers on
CREATE POLICY "Buyers can view scrap items they have offers on"
ON public.scrap_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM offers
    WHERE offers.scrap_item_id = scrap_items.id
    AND offers.buyer_id = auth.uid()
  )
);

-- Add policy for buyers to view scrap items they have transactions for
CREATE POLICY "Buyers can view scrap items they have transactions for"
ON public.scrap_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM transactions
    WHERE transactions.scrap_item_id = scrap_items.id
    AND transactions.buyer_id = auth.uid()
  )
);