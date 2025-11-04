-- Update RLS policy to allow buyers to accept/reject counter offers
DROP POLICY IF EXISTS "Buyers can update their pending offers" ON public.offers;

-- Create new policy that allows buyers to update offers in 'countered' status as well
CREATE POLICY "Buyers can update their offers" 
ON public.offers 
FOR UPDATE 
USING (
  auth.uid() = buyer_id AND 
  status IN ('pending', 'countered')
);