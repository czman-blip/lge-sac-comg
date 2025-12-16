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
  productTypes: string[];
  selectedFilter: string;
}

export const CategorySection = ({ category, onUpdate, onDelete, editMode, productTypes, selectedFilter }: CategorySectionProps) => {
  const addItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: "New checklist item",
      ok: false,
      ng: false,
      issue: "",
      images: [],
      productType: "Common",
      referenceImages: [],
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

  const moveItem = (draggedId: string, targetIndex: number) => {
    const draggedIndex = category.items.findIndex(item => item.id === draggedId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    const newItems = [...category.items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);
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
          <div
            key={item.id}
            onDragOver={(e) => {
              if (editMode) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDrop={(e) => {
              if (editMode) {
                e.preventDefault();
                const draggedId = e.dataTransfer.getData('text/plain');
                moveItem(draggedId, index);
              }
            }}
          >
            <ChecklistSection
              item={item}
              onUpdate={(updatedItem) => updateItem(index, updatedItem)}
              onDelete={() => deleteItem(index)}
              editMode={editMode}
              productTypes={productTypes}
            />
          </div>
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
