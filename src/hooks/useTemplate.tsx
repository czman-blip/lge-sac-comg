import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/types/report";
import { toast } from "sonner";

interface TemplateCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface TemplateItem {
  id: string;
  category_id: string;
  text: string;
  product_type: string;
  reference_images: string[];
  sort_order: number;
}

export const useTemplate = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplate = async (): Promise<Category[]> => {
    setIsLoading(true);
    try {
      const { data: categories, error: catError } = await supabase
        .from("template_categories")
        .select("*")
        .order("sort_order");

      if (catError) throw catError;

      if (!categories || categories.length === 0) {
        return [];
      }

      const { data: items, error: itemsError } = await supabase
        .from("template_items")
        .select("*")
        .order("sort_order");

      if (itemsError) throw itemsError;

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

      return template;
    } catch (error) {
      console.error("Failed to load template:", error);
      toast.error("Failed to load template from server");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async (categories: Category[]) => {
    setIsLoading(true);
    try {
      // Delete existing template
      await supabase.from("template_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("template_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert categories
      const categoryInserts = categories.map((cat, index) => ({
        id: cat.id,
        name: cat.name,
        sort_order: index,
      }));

      const { error: catError } = await supabase
        .from("template_categories")
        .insert(categoryInserts);

      if (catError) throw catError;

      // Insert items
      const itemInserts = categories.flatMap((cat) =>
        cat.items.map((item, index) => ({
          id: item.id,
          category_id: cat.id,
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

        if (itemsError) throw itemsError;
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
