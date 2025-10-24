import { Category, ChecklistItem } from "@/types/report";
import { ChecklistSection } from "./ChecklistSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface CategorySectionProps {
  category: Category;
  onUpdate: (category: Category) => void;
  onDelete: () => void;
  editMode: boolean;
}

export const CategorySection = ({ category, onUpdate, onDelete, editMode }: CategorySectionProps) => {
  const addItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: "New checklist item",
      ok: false,
      ng: false,
      issue: "",
      images: [],
    };
    onUpdate({ ...category, items: [...category.items, newItem] });
  };

  const updateItem = (index: number, item: ChecklistItem) => {
    const newItems = [...category.items];
    newItems[index] = item;
    onUpdate({ ...category, items: newItems });
  };

  const deleteItem = (index: number) => {
    const newItems = category.items.filter((_, i) => i !== index);
    onUpdate({ ...category, items: newItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 border-b-2 border-primary pb-2">
        {editMode ? (
          <Input
            value={category.name}
            onChange={(e) => onUpdate({ ...category, name: e.target.value })}
            className="text-lg font-semibold h-14 py-3 leading-normal"
            placeholder="Category name"
          />
        ) : (
          <h2 className="text-lg font-semibold flex-1">{category.name}</h2>
        )}
        
        {editMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>

      <div className="space-y-3 pl-4">
        {category.items.map((item, index) => (
          <ChecklistSection
            key={item.id}
            item={item}
            onUpdate={(updatedItem) => updateItem(index, updatedItem)}
            onDelete={() => deleteItem(index)}
            editMode={editMode}
          />
        ))}

        {editMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>
    </div>
  );
};
