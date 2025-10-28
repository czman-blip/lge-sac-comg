import { ChecklistItem } from "@/types/report";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "./ImageUpload";
import { Trash2, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface ChecklistSectionProps {
  item: ChecklistItem;
  onUpdate: (item: ChecklistItem) => void;
  onDelete: () => void;
  editMode: boolean;
  productTypes: string[];
}

export const ChecklistSection = ({ item, onUpdate, onDelete, editMode, productTypes }: ChecklistSectionProps) => {
  const [showReferenceDialog, setShowReferenceDialog] = useState(false);
  
  return (
    <div className="border border-border rounded-lg p-3 sm:p-4 bg-card space-y-3">
      <div className="flex flex-col gap-3">
        {/* 1. Product Type and Checklist Item in one line */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <Select 
            value={item.productType || "Common"} 
            onValueChange={(value) => onUpdate({ ...item, productType: value })}
            disabled={!editMode}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Common">Common</SelectItem>
              {productTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {editMode ? (
            <Input
              value={item.text}
              onChange={(e) => onUpdate({ ...item, text: e.target.value })}
              className="font-medium h-12 pt-3 pb-3.5 leading-[1.35] flex-1"
              placeholder="Checklist item"
            />
          ) : (
            <p className="font-medium flex-1 py-2">{item.text}</p>
          )}
        </div>
        
        {/* 3. OK, NG, Reference buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 cursor-pointer min-w-[70px]">
            <span className="text-sm font-medium">OK</span>
            <Checkbox
              checked={item.ok}
              onCheckedChange={(checked) =>
                onUpdate({ ...item, ok: checked as boolean, ng: false })
              }
            />
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer min-w-[70px]">
            <span className="text-sm font-medium">NG</span>
            <Checkbox
              checked={item.ng}
              onCheckedChange={(checked) =>
                onUpdate({ ...item, ng: checked as boolean, ok: false })
              }
            />
          </label>
          
          <Dialog open={showReferenceDialog} onOpenChange={setShowReferenceDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs sm:text-sm"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Reference</span>
                <span className="sm:hidden">Ref</span>
                {item.referenceImages && item.referenceImages.length > 0 && (
                  <span className="text-xs">({item.referenceImages.length})</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Reference Images</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {editMode ? (
                  <ImageUpload
                    images={item.referenceImages || []}
                    onImagesChange={(images) => onUpdate({ ...item, referenceImages: images })}
                    disabled={false}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {item.referenceImages && item.referenceImages.length > 0 ? (
                      item.referenceImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-auto rounded-lg border border-border"
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No reference images available
                      </p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
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

      {/* 4. Issue field */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Issue:</label>
        <Input
          value={item.issue}
          onChange={(e) => onUpdate({ ...item, issue: e.target.value })}
          placeholder="Describe any issues..."
          className="w-full h-12 pt-3 pb-3.5 leading-[1.35]"
        />
      </div>

      {/* 5. Add Image */}
      <div>
        <ImageUpload
          images={item.images}
          onImagesChange={(images) => onUpdate({ ...item, images })}
          disabled={false}
        />
      </div>
    </div>
  );
};
