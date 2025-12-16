-- Update template_categories RLS policies to allow anonymous authenticated users
DROP POLICY IF EXISTS "Editors can insert template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Editors can update template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Editors can delete template_categories" ON public.template_categories;

CREATE POLICY "Authenticated users can insert template_categories" 
ON public.template_categories 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update template_categories" 
ON public.template_categories 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete template_categories" 
ON public.template_categories 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update template_items RLS policies
DROP POLICY IF EXISTS "Editors can insert template_items" ON public.template_items;
DROP POLICY IF EXISTS "Editors can update template_items" ON public.template_items;
DROP POLICY IF EXISTS "Editors can delete template_items" ON public.template_items;

CREATE POLICY "Authenticated users can insert template_items" 
ON public.template_items 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update template_items" 
ON public.template_items 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete template_items" 
ON public.template_items 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Update template_settings RLS policies
DROP POLICY IF EXISTS "Editors can insert template_settings" ON public.template_settings;
DROP POLICY IF EXISTS "Editors can update template_settings" ON public.template_settings;
DROP POLICY IF EXISTS "Editors can delete template_settings" ON public.template_settings;

CREATE POLICY "Authenticated users can insert template_settings" 
ON public.template_settings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update template_settings" 
ON public.template_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete template_settings" 
ON public.template_settings 
FOR DELETE 
USING (auth.uid() IS NOT NULL);