-- Drop existing overly permissive policies for template_categories
DROP POLICY IF EXISTS "Enable all access for template_categories" ON template_categories;
DROP POLICY IF EXISTS "Enable read access for template_categories" ON template_categories;

-- Create proper RLS policies for template_categories
-- SELECT: Anyone can read templates (for loading checklist)
CREATE POLICY "Anyone can read template_categories"
  ON template_categories FOR SELECT
  USING (true);

-- INSERT: Only editors/admins can create templates
CREATE POLICY "Editors can insert template_categories"
  ON template_categories FOR INSERT
  WITH CHECK (can_edit(auth.uid()));

-- UPDATE: Only editors/admins can update templates
CREATE POLICY "Editors can update template_categories"
  ON template_categories FOR UPDATE
  USING (can_edit(auth.uid()));

-- DELETE: Only editors/admins can delete templates
CREATE POLICY "Editors can delete template_categories"
  ON template_categories FOR DELETE
  USING (can_edit(auth.uid()));

-- Drop existing overly permissive policies for template_items
DROP POLICY IF EXISTS "Enable all access for template_items" ON template_items;
DROP POLICY IF EXISTS "Enable read access for template_items" ON template_items;

-- Create proper RLS policies for template_items
-- SELECT: Anyone can read template items
CREATE POLICY "Anyone can read template_items"
  ON template_items FOR SELECT
  USING (true);

-- INSERT: Only editors/admins can create template items
CREATE POLICY "Editors can insert template_items"
  ON template_items FOR INSERT
  WITH CHECK (can_edit(auth.uid()));

-- UPDATE: Only editors/admins can update template items
CREATE POLICY "Editors can update template_items"
  ON template_items FOR UPDATE
  USING (can_edit(auth.uid()));

-- DELETE: Only editors/admins can delete template items
CREATE POLICY "Editors can delete template_items"
  ON template_items FOR DELETE
  USING (can_edit(auth.uid()));