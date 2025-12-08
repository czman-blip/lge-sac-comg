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
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserRoleWithEmail {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email: string;
}

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<UserRoleWithEmail[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("viewer");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [addingRole, setAddingRole] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }

    if (user) {
      checkAdminAndLoadRoles();
    }
  }, [user, loading, navigate]);

  const checkAdminAndLoadRoles = async () => {
    if (!user) return;

    try {
      const { data: hasAdminRole, error: roleError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (roleError) throw roleError;

      if (!hasAdminRole) {
        toast.error("관리자 권한이 필요합니다");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadUserRoles();
    } catch (error) {
      console.error("Error checking admin role:", error);
      navigate("/");
    }
  };

  const loadUserRoles = async () => {
    setLoadingRoles(true);
    try {
      // Get user roles with profile email
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });

      if (rolesError) throw rolesError;

      // Get profiles for all users with roles
      const userIds = roles?.map((r) => r.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge roles with emails
      const rolesWithEmail: UserRoleWithEmail[] = (roles || []).map((role) => {
        const profile = profiles?.find((p) => p.id === role.user_id);
        return {
          ...role,
          email: profile?.email || "Unknown",
        };
      });

      setUserRoles(rolesWithEmail);
    } catch (error) {
      console.error("Error loading user roles:", error);
      toast.error("역할 목록을 불러오는데 실패했습니다");
    } finally {
      setLoadingRoles(false);
    }
  };

  const addUserRoleByEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }

    setAddingRole(true);
    try {
      // Find user by email in profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", newEmail.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error("해당 이메일의 사용자를 찾을 수 없습니다. 먼저 회원가입을 해야 합니다.");
        return;
      }

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (existingRole) {
        toast.error("이미 해당 사용자에게 역할이 할당되어 있습니다");
        return;
      }

      // Add role
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: profile.id,
        role: newRole,
      });

      if (insertError) throw insertError;

      toast.success("역할이 추가되었습니다");
      setNewEmail("");
      await loadUserRoles();
    } catch (error: any) {
      console.error("Error adding user role:", error);
      toast.error(error.message || "역할 추가에 실패했습니다");
    } finally {
      setAddingRole(false);
    }
  };

  const updateUserRole = async (id: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("id", id);

      if (error) throw error;

      toast.success("역할이 변경되었습니다");
      await loadUserRoles();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("역할 변경에 실패했습니다");
    }
  };

  const deleteUserRole = async (id: string) => {
    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);

      if (error) throw error;

      toast.success("역할이 삭제되었습니다");
      await loadUserRoles();
    } catch (error) {
      console.error("Error deleting user role:", error);
      toast.error("역할 삭제에 실패했습니다");
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>사용자 역할 관리</CardTitle>
          <CardDescription>
            사용자에게 역할을 할당하거나 변경할 수 있습니다. admin과 editor 역할은 편집 모드에 접근할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add new role */}
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="이메일 주소"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addUserRoleByEmail} disabled={addingRole}>
              <UserPlus className="mr-2 h-4 w-4" />
              {addingRole ? "추가 중..." : "추가"}
            </Button>
          </div>

          {/* User roles table */}
          {loadingRoles ? (
            <p className="text-center py-4">로딩 중...</p>
          ) : userRoles.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">등록된 역할이 없습니다</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead className="w-20">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((ur) => (
                  <TableRow key={ur.id}>
                    <TableCell>{ur.email}</TableCell>
                    <TableCell>
                      <Select
                        value={ur.role}
                        onValueChange={(v) => updateUserRole(ur.id, v as AppRole)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteUserRole(ur.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
