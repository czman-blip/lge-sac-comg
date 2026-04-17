-- Tighten template_categories writes
DROP POLICY IF EXISTS "Authenticated users can insert template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Authenticated users can update template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Authenticated users can delete template_categories" ON public.template_categories;

CREATE POLICY "Editors can insert template_categories"
  ON public.template_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update template_categories"
  ON public.template_categories FOR UPDATE
  TO authenticated
  USING (public.can_edit(auth.uid()));

CREATE POLICY "Editors can delete template_categories"
  ON public.template_categories FOR DELETE
  TO authenticated
  USING (public.can_edit(auth.uid()));

-- Tighten template_items writes
DROP POLICY IF EXISTS "Authenticated users can insert template_items" ON public.template_items;
DROP POLICY IF EXISTS "Authenticated users can update template_items" ON public.template_items;
DROP POLICY IF EXISTS "Authenticated users can delete template_items" ON public.template_items;

CREATE POLICY "Editors can insert template_items"
  ON public.template_items FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update template_items"
  ON public.template_items FOR UPDATE
  TO authenticated
  USING (public.can_edit(auth.uid()));

CREATE POLICY "Editors can delete template_items"
  ON public.template_items FOR DELETE
  TO authenticated
  USING (public.can_edit(auth.uid()));

-- Tighten template_settings writes (consistency)
DROP POLICY IF EXISTS "Authenticated users can insert template_settings" ON public.template_settings;
DROP POLICY IF EXISTS "Authenticated users can update template_settings" ON public.template_settings;
DROP POLICY IF EXISTS "Authenticated users can delete template_settings" ON public.template_settings;

CREATE POLICY "Editors can insert template_settings"
  ON public.template_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit(auth.uid()));

CREATE POLICY "Editors can update template_settings"
  ON public.template_settings FOR UPDATE
  TO authenticated
  USING (public.can_edit(auth.uid()));

CREATE POLICY "Editors can delete template_settings"
  ON public.template_settings FOR DELETE
  TO authenticated
  USING (public.can_edit(auth.uid()));