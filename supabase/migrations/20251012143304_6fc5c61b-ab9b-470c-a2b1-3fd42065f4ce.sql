-- Drop the existing restrictive buyer update policy
DROP POLICY IF EXISTS "Buyers can update their offers" ON public.offers;

-- Create a new policy that allows buyers to accept or reject counter offers
CREATE POLICY "Buyers can update their offers"
ON public.offers
FOR UPDATE
USING (
  auth.uid() = buyer_id 
  AND status = ANY (ARRAY['pending'::text, 'countered'::text])
)
WITH CHECK (
  auth.uid() = buyer_id
  AND status = ANY (ARRAY['pending'::text, 'countered'::text, 'accepted'::text, 'rejected'::text])
);