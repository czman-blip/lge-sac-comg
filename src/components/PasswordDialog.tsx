import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ADMIN_PASSWORD = "admin123";
const PASSWORD_KEY = "edit_mode_password";

export const PasswordDialog = ({ open, onOpenChange, onSuccess }: PasswordDialogProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedPassword = sessionStorage.getItem(PASSWORD_KEY) || ADMIN_PASSWORD;
    
    if (password === storedPassword) {
      setIsLoading(true);
      try {
        // Sign in anonymously to get auth.uid() for RLS policies
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Anonymous sign-in failed:", error);
          toast.error("Failed to authenticate for edit mode");
          return;
        }
        onSuccess();
        onOpenChange(false);
        setPassword("");
        toast.success("Edit mode activated");
      } catch (error) {
        console.error("Authentication error:", error);
        toast.error("Failed to activate edit mode");
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.error("Incorrect password");
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Password</DialogTitle>
          <DialogDescription>
            Please enter the password to access Edit mode
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPassword("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
