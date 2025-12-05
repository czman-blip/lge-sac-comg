import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Trash2, UserPlus } from "lucide-react";

type AppRole = "admin" | "editor" | "viewer";

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, role, isLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("editor");

  // Check if current user is admin
  useEffect(() => {
    if (!isLoading && (!user || role !== "admin")) {
      toast.error("관리자만 접근할 수 있습니다");
      navigate("/");
    }
  }, [user, role, isLoading, navigate]);

  // Fetch all user roles
  const fetchUserRoles = async () => {
    setLoading(true);
    try {
      // First get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Get user emails from auth (we'll need to use a different approach)
      // Since we can't query auth.users directly, we'll show user_id
      setUserRoles(roles || []);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("사용자 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && role === "admin") {
      fetchUserRoles();
    }
  }, [user, role]);

  const handleAddRole = async () => {
    if (!newEmail.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    try {
      // We need to find the user by email - but we can't query auth.users directly
      // Instead, let the admin input the user_id directly or use a different approach
      // For now, we'll create a simple approach where admin enters user_id
      
      // Check if this looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newEmail.trim());
      
      if (!isUUID) {
        toast.error("유효한 User ID (UUID 형식)를 입력해주세요");
        return;
      }

      const userId = newEmail.trim();

      // Check if user already has a role
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        toast.error("이미 역할이 부여된 사용자입니다");
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;

      toast.success("역할이 추가되었습니다");
      setNewEmail("");
      fetchUserRoles();
    } catch (error) {
      console.error("Error adding role:", error);
      toast.error("역할 추가에 실패했습니다");
    }
  };

  const handleUpdateRole = async (id: string, newRoleValue: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRoleValue })
        .eq("id", id);

      if (error) throw error;

      toast.success("역할이 변경되었습니다");
      fetchUserRoles();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("역할 변경에 실패했습니다");
    }
  };

  const handleDeleteRole = async (id: string, userId: string) => {
    // Prevent deleting own role
    if (userId === user?.id) {
      toast.error("자신의 역할은 삭제할 수 없습니다");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("역할이 삭제되었습니다");
      fetchUserRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("역할 삭제에 실패했습니다");
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case "admin": return "관리자 (Admin)";
      case "editor": return "편집자 (Editor)";
      case "viewer": return "뷰어 (Viewer)";
      default: return role;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">사용자 역할 관리</h1>
        </div>

        {/* Add New Role */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              새 역할 추가
            </CardTitle>
            <CardDescription>
              새 사용자에게 역할을 부여합니다. User ID는 사용자가 로그인 후 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="User ID (UUID)"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">관리자 (Admin)</SelectItem>
                  <SelectItem value="editor">편집자 (Editor)</SelectItem>
                  <SelectItem value="viewer">뷰어 (Viewer)</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddRole}>
                추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>
              현재 역할이 부여된 사용자 목록입니다. Admin과 Editor만 Edit mode에 접근할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className="w-20">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((ur) => (
                  <TableRow key={ur.id}>
                    <TableCell className="font-mono text-xs">
                      {ur.user_id}
                      {ur.user_id === user?.id && (
                        <span className="ml-2 text-primary font-semibold">(나)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={ur.role}
                        onValueChange={(v) => handleUpdateRole(ur.id, v as AppRole)}
                        disabled={ur.user_id === user?.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">관리자 (Admin)</SelectItem>
                          <SelectItem value="editor">편집자 (Editor)</SelectItem>
                          <SelectItem value="viewer">뷰어 (Viewer)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(ur.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRole(ur.id, ur.user_id)}
                        disabled={ur.user_id === user?.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {userRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      등록된 사용자가 없습니다
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
