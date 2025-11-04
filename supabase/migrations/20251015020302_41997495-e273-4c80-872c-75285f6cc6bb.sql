-- Create storage bucket for scrap item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('scrap-images', 'scrap-images', true);

-- RLS policies for scrap-images bucket
CREATE POLICY "Anyone can view scrap images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'scrap-images');

CREATE POLICY "Authenticated users can upload scrap images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'scrap-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own scrap images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'scrap-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own scrap images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'scrap-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);