
DROP POLICY IF EXISTS "Editors can insert template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Editors can update template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Editors can delete template_categories" ON public.template_categories;
CREATE POLICY "Authenticated can insert template_categories" ON public.template_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update template_categories" ON public.template_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete template_categories" ON public.template_categories FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Editors can insert template_items" ON public.template_items;
DROP POLICY IF EXISTS "Editors can update template_items" ON public.template_items;
DROP POLICY IF EXISTS "Editors can delete template_items" ON public.template_items;
CREATE POLICY "Authenticated can insert template_items" ON public.template_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update template_items" ON public.template_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete template_items" ON public.template_items FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Editors can insert template_settings" ON public.template_settings;
DROP POLICY IF EXISTS "Editors can update template_settings" ON public.template_settings;
DROP POLICY IF EXISTS "Editors can delete template_settings" ON public.template_settings;
CREATE POLICY "Authenticated can insert template_settings" ON public.template_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update template_settings" ON public.template_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete template_settings" ON public.template_settings FOR DELETE TO authenticated USING (true);
