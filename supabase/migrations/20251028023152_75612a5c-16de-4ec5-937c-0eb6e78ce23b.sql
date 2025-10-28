-- Add product_type and reference_images columns to checklist_items table
ALTER TABLE public.checklist_items
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'Common',
ADD COLUMN IF NOT EXISTS reference_images text[] DEFAULT '{}';

-- Add installer_signature column to reports table
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS installer_signature text;

-- Create a template_categories table for shared template
CREATE TABLE IF NOT EXISTS public.template_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create a template_items table for shared checklist template
CREATE TABLE IF NOT EXISTS public.template_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.template_categories(id) ON DELETE CASCADE,
  text text NOT NULL,
  product_type text DEFAULT 'Common',
  reference_images text[] DEFAULT '{}',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on template tables
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_items ENABLE ROW LEVEL SECURITY;

-- Create policies for template tables (everyone can read, no auth needed)
CREATE POLICY "Enable read access for template_categories"
ON public.template_categories FOR SELECT
USING (true);

CREATE POLICY "Enable all access for template_categories"
ON public.template_categories FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable read access for template_items"
ON public.template_items FOR SELECT
USING (true);

CREATE POLICY "Enable all access for template_items"
ON public.template_items FOR ALL
USING (true)
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_template_categories_updated_at
BEFORE UPDATE ON public.template_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_items_updated_at
BEFORE UPDATE ON public.template_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();