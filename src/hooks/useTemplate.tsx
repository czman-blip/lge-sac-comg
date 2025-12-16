import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/report";
import { toast } from "sonner";

interface TemplateData {
  categories: Category[];
  productTypes: string[];
}

export const useTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplate = async (): Promise<TemplateData> => {
    setIsLoading(true);
    try {
      // Load categories
      const { data: categories, error: catError } = await supabase
        .from("template_categories")
        .select("*")
        .order("sort_order");

      if (catError) throw catError;

      // Load items
      const { data: items, error: itemsError } = await supabase
        .from("template_items")
        .select("*")
        .order("sort_order");

      if (itemsError) throw itemsError;

      // Load product types from settings
      const { data: settings, error: settingsError } = await supabase
        .from("template_settings")
        .select("value")
        .eq("key", "product_types")
        .maybeSingle();

      if (settingsError) {
        console.error("Failed to load product types:", settingsError);
      }

      const productTypes = settings?.value as string[] || ["Multi V", "AHU", "ISC", "Water", "H/Kit"];

      if (!categories || categories.length === 0) {
        return { categories: [], productTypes };
      }

      const template: Category[] = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: (items || [])
          .filter((item) => item.category_id === cat.id)
          .map((item) => ({
            id: item.id,
            text: item.text,
            productType: item.product_type || "Common",
            referenceImages: item.reference_images || [],
            ok: false,
            ng: false,
            issue: "",
            images: [],
          })),
      }));

      return { categories: template, productTypes };
    } catch (error) {
      console.error("Failed to load template:", error);
      toast.error("Failed to load template from server");
      return { categories: [], productTypes: ["Multi V", "AHU", "ISC", "Water", "H/Kit"] };
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async (categories: Category[], productTypes: string[]) => {
    setIsLoading(true);
    try {
      // Delete existing template items first, then categories
      const { error: deleteItemsError } = await supabase
        .from("template_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteItemsError) {
        console.error("Failed to delete template items:", deleteItemsError);
        throw deleteItemsError;
      }

      const { error: deleteCatError } = await supabase
        .from("template_categories")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteCatError) {
        console.error("Failed to delete template categories:", deleteCatError);
        throw deleteCatError;
      }

      // Create ID mapping for categories (old ID -> new UUID)
      const categoryIdMap = new Map<string, string>();
      
      // Insert categories with new UUIDs
      if (categories.length > 0) {
        const categoryInserts = categories.map((cat, index) => {
          const newId = crypto.randomUUID();
          categoryIdMap.set(cat.id, newId);
          return {
            id: newId,
            name: cat.name,
            sort_order: index,
          };
        });

        const { error: catError } = await supabase
          .from("template_categories")
          .insert(categoryInserts);

        if (catError) {
          console.error("Failed to insert categories:", catError);
          throw catError;
        }
      }

      // Insert items with new UUIDs and mapped category IDs
      const itemInserts = categories.flatMap((cat) =>
        cat.items.map((item, index) => ({
          id: crypto.randomUUID(),
          category_id: categoryIdMap.get(cat.id) || cat.id,
          text: item.text,
          product_type: item.productType || "Common",
          reference_images: item.referenceImages || [],
          sort_order: index,
        }))
      );

      if (itemInserts.length > 0) {
        const { error: itemsError } = await supabase
          .from("template_items")
          .insert(itemInserts);

        if (itemsError) {
          console.error("Failed to insert items:", itemsError);
          throw itemsError;
        }
      }

      // Save product types using upsert
      const { error: settingsError } = await supabase
        .from("template_settings")
        .upsert(
          { key: "product_types", value: productTypes },
          { onConflict: "key" }
        );

      if (settingsError) {
        console.error("Failed to save product types:", settingsError);
        throw settingsError;
      }

      toast.success("Template saved to server");
    } catch (error) {
      console.error("Failed to save template:", error);
      toast.error("Failed to save template to server");
    } finally {
      setIsLoading(false);
    }
  };

  return { loadTemplate, saveTemplate, isLoading };
};
