import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/report";
import { toast } from "sonner";

const DEFAULT_PRODUCT_TYPES = ["Multi V", "AHU", "ISC", "Water", "H/Kit", "DOAS"];

interface TemplateData {
  categories: Category[];
  productTypes: string[];
}

export const useTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplate = async (): Promise<TemplateData> => {
    setIsLoading(true);
    try {
      // Load all data in parallel for faster loading
      const [categoriesResult, itemsResult, settingsResult] = await Promise.all([
        supabase
          .from("template_categories")
          .select("*")
          .order("sort_order"),
        supabase
          .from("template_items")
          .select("*")
          .order("sort_order"),
        supabase
          .from("template_settings")
          .select("value")
          .eq("key", "product_types")
          .maybeSingle(),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (settingsResult.error) {
        console.error("Failed to load product types:", settingsResult.error);
      }

      const categories = categoriesResult.data;
      const items = itemsResult.data;
      const productTypes = settingsResult.data?.value as string[] || DEFAULT_PRODUCT_TYPES;

      // Return empty categories if database is empty
      if (!categories || categories.length === 0) {
        return { categories: [], productTypes };
      }

      // Pre-group items by category_id for O(1) lookup instead of O(n) filter
      const itemsByCategory = new Map<string, typeof items>();
      (items || []).forEach((item) => {
        const categoryItems = itemsByCategory.get(item.category_id) || [];
        categoryItems.push(item);
        itemsByCategory.set(item.category_id, categoryItems);
      });

      const template: Category[] = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        items: (itemsByCategory.get(cat.id) || []).map((item) => ({
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
      return { categories: [], productTypes: DEFAULT_PRODUCT_TYPES };
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
