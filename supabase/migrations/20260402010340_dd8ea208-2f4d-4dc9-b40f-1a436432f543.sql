-- Create storage bucket for reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('reference-images', 'reference-images', true);

-- Allow public read access
CREATE POLICY "Public read access for reference images"
ON storage.objects FOR SELECT
USING (bucket_id = 'reference-images');

-- Allow anyone to upload reference images
CREATE POLICY "Anyone can upload reference images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reference-images');

-- Allow anyone to update reference images
CREATE POLICY "Anyone can update reference images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reference-images');

-- Allow anyone to delete reference images
CREATE POLICY "Anyone can delete reference images"
ON storage.objects FOR DELETE
USING (bucket_id = 'reference-images');
