import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, FileText } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  item_id: string;
  change_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  item_text?: string;
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string;
}

export const HistoryDialog = ({ open, onOpenChange, itemId }: HistoryDialogProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, itemId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("item_history")
        .select("*")
        .order("changed_at", { ascending: false });

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get item texts for better display
      const itemIds = [...new Set(data?.map(h => h.item_id) || [])];
      const { data: items } = await supabase
        .from("checklist_items")
        .select("id, text")
        .in("id", itemIds);

      const itemsMap = new Map(items?.map(item => [item.id, item.text]) || []);
      
      const enrichedData = data?.map(h => ({
        ...h,
        item_text: itemsMap.get(h.item_id)
      })) || [];

      setHistory(enrichedData);
    } catch (error) {
      console.error("Failed to load history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const getChangeDescription = (item: HistoryItem) => {
    const itemLabel = item.item_text || "Item";
    
    switch (item.change_type) {
      case "created":
        return `Created: ${itemLabel}`;
      case "deleted":
        return `Deleted: ${itemLabel}`;
      case "updated":
        if (item.field_name === "text") {
          return `Updated text from "${item.old_value}" to "${item.new_value}"`;
        } else if (item.field_name === "ok") {
          return `${item.new_value === "true" ? "Checked" : "Unchecked"} OK status`;
        } else if (item.field_name === "ng") {
          return `${item.new_value === "true" ? "Checked" : "Unchecked"} NG status`;
        } else if (item.field_name === "issue") {
          return `Updated issue description`;
        }
        return `Updated ${item.field_name}`;
      default:
        return "Unknown change";
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "created":
        return "text-green-600 dark:text-green-400";
      case "deleted":
        return "text-red-600 dark:text-red-400";
      case "updated":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Change History
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[500px] pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-muted-foreground">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <FileText className="w-12 h-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className={`font-medium ${getChangeColor(item.change_type)}`}>
                        {getChangeDescription(item)}
                      </p>
                      {item.old_value && item.new_value && item.field_name === "issue" && (
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            <span className="font-semibold">From:</span> {item.old_value}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-semibold">To:</span> {item.new_value}
                          </p>
                        </div>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(item.changed_at), "MMM dd, yyyy HH:mm")}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
