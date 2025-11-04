-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'buyer', 'admin')) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scrap_items table
CREATE TABLE public.scrap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL CHECK (weight_kg > 0),
  expected_price DECIMAL(10,2) NOT NULL CHECK (expected_price > 0),
  actual_price DECIMAL(10,2),
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('available', 'sold', 'pending')) DEFAULT 'available',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scrap_item_id UUID NOT NULL REFERENCES public.scrap_items(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Buyers can view customer profiles for transactions"
ON public.profiles
FOR SELECT
USING (
  role = 'customer' AND 
  EXISTS (
    SELECT 1 FROM public.scrap_items si 
    WHERE si.customer_id = user_id 
    AND si.status = 'available'
  )
);

-- RLS Policies for scrap_items
CREATE POLICY "Anyone can view available scrap items" 
ON public.scrap_items 
FOR SELECT 
USING (status = 'available');

CREATE POLICY "Customers can view their own scrap items" 
ON public.scrap_items 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create scrap items" 
ON public.scrap_items 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own scrap items" 
ON public.scrap_items 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Buyers can update scrap items when purchasing"
ON public.scrap_items
FOR UPDATE
USING (
  status = 'available' AND
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'buyer'
  )
);

-- RLS Policies for transactions
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

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scrap_items_updated_at
  BEFORE UPDATE ON public.scrap_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_scrap_items_category ON public.scrap_items(category);
CREATE INDEX idx_scrap_items_status ON public.scrap_items(status);
CREATE INDEX idx_scrap_items_customer ON public.scrap_items(customer_id);
CREATE INDEX idx_transactions_buyer ON public.transactions(buyer_id);
CREATE INDEX idx_transactions_customer ON public.transactions(customer_id);