-- Run this SQL in your Supabase SQL Editor to fix the status update issue

SELECT user_id, full_name, role FROM profiles WHERE user_id = auth.uid();

DROP POLICY IF EXISTS "Buyers can update items to sold" ON public.scrap_items;

CREATE POLICY "Buyers can update items to sold"
ON public.scrap_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'buyer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'buyer'
  )
);