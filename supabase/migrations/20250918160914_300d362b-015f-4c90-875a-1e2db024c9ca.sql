-- Create offers table for price negotiations
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrap_item_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  offered_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  message TEXT,
  counter_price NUMERIC,
  counter_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policies for offers
CREATE POLICY "Users can view their own offers"
ON public.offers
FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = customer_id);

CREATE POLICY "Buyers can create offers"
ON public.offers
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Customers can update offers (counter/accept/reject)"
ON public.offers
FOR UPDATE
USING (auth.uid() = customer_id);

CREATE POLICY "Buyers can update their pending offers"
ON public.offers
FOR UPDATE
USING (auth.uid() = buyer_id AND status = 'pending');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for offers table
ALTER TABLE public.offers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;