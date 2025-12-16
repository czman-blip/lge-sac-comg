-- Create template_settings table to store product types and other global settings
CREATE TABLE public.template_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read template settings
CREATE POLICY "Anyone can read template_settings"
ON public.template_settings
FOR SELECT
USING (true);

-- Editors can modify template settings
CREATE POLICY "Editors can insert template_settings"
ON public.template_settings
FOR INSERT
WITH CHECK (can_edit(auth.uid()));

CREATE POLICY "Editors can update template_settings"
ON public.template_settings
FOR UPDATE
USING (can_edit(auth.uid()));

CREATE POLICY "Editors can delete template_settings"
ON public.template_settings
FOR DELETE
USING (can_edit(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_template_settings_updated_at
BEFORE UPDATE ON public.template_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default product types
INSERT INTO public.template_settings (key, value)
VALUES ('product_types', '["Multi V", "AHU", "ISC", "Water", "H/Kit"]'::jsonb);