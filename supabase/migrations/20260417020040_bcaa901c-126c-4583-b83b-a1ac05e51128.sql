-- Tighten storage policies on reference-images bucket
DROP POLICY IF EXISTS "Anyone can upload reference images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update reference images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete reference images" ON storage.objects;

CREATE POLICY "Editors can upload reference images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-images' AND public.can_edit(auth.uid()));

CREATE POLICY "Editors can update reference images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'reference-images' AND public.can_edit(auth.uid()));

CREATE POLICY "Editors can delete reference images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reference-images' AND public.can_edit(auth.uid()));

-- Tighten profiles policies: restrict to authenticated role
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);