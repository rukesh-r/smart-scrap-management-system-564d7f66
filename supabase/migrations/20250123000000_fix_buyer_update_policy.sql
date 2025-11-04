-- Drop the restrictive policy that prevents buyers from updating items after status change
DROP POLICY IF EXISTS "Buyers can update scrap items when purchasing" ON public.scrap_items;

-- Create a new policy that allows buyers to update available items to sold
CREATE POLICY "Buyers can update available items to sold"
ON public.scrap_items
FOR UPDATE
USING (
  status IN ('available', 'pending') AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'buyer'
  )
)
WITH CHECK (
  status = 'sold' AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'buyer'
  )
);
