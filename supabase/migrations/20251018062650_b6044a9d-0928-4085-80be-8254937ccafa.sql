-- Add UPI ID field to profiles table for payment details
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id text;