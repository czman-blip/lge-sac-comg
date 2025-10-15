import { ChecklistItem } from "@/types/report";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "./ImageUpload";
import { Trash2 } from "lucide-react";

interface ChecklistSectionProps {
  item: ChecklistItem;
  onUpdate: (item: ChecklistItem) => void;
  onDelete: () => void;
  editMode: boolean;
}

export const ChecklistSection = ({ item, onUpdate, onDelete, editMode }: ChecklistSectionProps) => {
  return (
    <div className="border border-border rounded-lg p-4 bg-card space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {editMode ? (
            <Input
              value={item.text}
              onChange={(e) => onUpdate({ ...item, text: e.target.value })}
              className="font-medium"
              placeholder="Checklist item"
            />
          ) : (
            <p className="font-medium">{item.text}</p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">OK</span>
            <Checkbox
              checked={item.ok}
              onCheckedChange={(checked) =>
                onUpdate({ ...item, ok: checked as boolean, ng: false })
              }
            />
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm">NG</span>
            <Checkbox
              checked={item.ng}
              onCheckedChange={(checked) =>
                onUpdate({ ...item, ng: checked as boolean, ok: false })
              }
            />
          </label>
          
          {editMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {!item.ok && (
        <div className="flex items-center gap-3 min-h-[44px]">
          <label className="text-sm font-medium whitespace-nowrap">Issue:</label>
          <Input
            value={item.issue}
            onChange={(e) => onUpdate({ ...item, issue: e.target.value })}
            placeholder="Describe any issues..."
            className="flex-1 h-12 leading-6 py-2"
          />
        </div>
      )}

      {!item.ok && (
        <div className="mt-2">
          <ImageUpload
            images={item.images}
            onImagesChange={(images) => onUpdate({ ...item, images })}
            disabled={false}
          />
        </div>
      )}
    </div>
  );
};
