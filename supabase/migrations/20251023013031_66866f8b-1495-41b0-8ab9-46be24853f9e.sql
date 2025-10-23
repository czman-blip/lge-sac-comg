-- Create reports table to store project information
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name TEXT NOT NULL,
  opportunity_number TEXT,
  address TEXT,
  inspection_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  commissioner_signature TEXT,
  customer_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  ok BOOLEAN DEFAULT false,
  ng BOOLEAN DEFAULT false,
  issue TEXT,
  images TEXT[],
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create item_history table to track all changes
CREATE TABLE public.item_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  field_name TEXT, -- which field was changed
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_name TEXT,
  quantity TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now - can be restricted later)
CREATE POLICY "Enable all access for reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for checklist_items" ON public.checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for item_history" ON public.item_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_categories_report_id ON public.categories(report_id);
CREATE INDEX idx_checklist_items_category_id ON public.checklist_items(category_id);
CREATE INDEX idx_item_history_item_id ON public.item_history(item_id);
CREATE INDEX idx_products_report_id ON public.products(report_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
BEFORE UPDATE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to log item changes
CREATE OR REPLACE FUNCTION public.log_item_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.item_history (item_id, change_type, field_name, new_value)
    VALUES (NEW.id, 'created', 'item', NEW.text);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.text IS DISTINCT FROM NEW.text THEN
      INSERT INTO public.item_history (item_id, change_type, field_name, old_value, new_value)
      VALUES (NEW.id, 'updated', 'text', OLD.text, NEW.text);
    END IF;
    IF OLD.ok IS DISTINCT FROM NEW.ok THEN
      INSERT INTO public.item_history (item_id, change_type, field_name, old_value, new_value)
      VALUES (NEW.id, 'updated', 'ok', OLD.ok::text, NEW.ok::text);
    END IF;
    IF OLD.ng IS DISTINCT FROM NEW.ng THEN
      INSERT INTO public.item_history (item_id, change_type, field_name, old_value, new_value)
      VALUES (NEW.id, 'updated', 'ng', OLD.ng::text, NEW.ng::text);
    END IF;
    IF OLD.issue IS DISTINCT FROM NEW.issue THEN
      INSERT INTO public.item_history (item_id, change_type, field_name, old_value, new_value)
      VALUES (NEW.id, 'updated', 'issue', OLD.issue, NEW.issue);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.item_history (item_id, change_type, field_name, old_value)
    VALUES (OLD.id, 'deleted', 'item', OLD.text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER log_checklist_item_changes
AFTER INSERT OR UPDATE OR DELETE ON public.checklist_items
FOR EACH ROW
EXECUTE FUNCTION public.log_item_changes();