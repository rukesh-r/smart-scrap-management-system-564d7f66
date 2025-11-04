-- Drop the existing customer update policy
DROP POLICY IF EXISTS "Customers can update offers (counter/accept/reject)" ON public.offers;

-- Create a new policy that allows customers to accept/reject/counter offers
CREATE POLICY "Customers can update offers (counter/accept/reject)"
ON public.offers
FOR UPDATE
USING (auth.uid() = customer_id)
WITH CHECK (
  auth.uid() = customer_id
  AND status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'countered'::text])
);