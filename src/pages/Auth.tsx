import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("올바른 이메일 형식이 아닙니다");
const passwordSchema = z.string().min(6, "비밀번호는 6자 이상이어야 합니다");

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [requestingEditor, setRequestingEditor] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch {
      toast.error("올바른 이메일 형식이 아닙니다");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("로그인 성공");
    } catch (error: any) {
      toast.error(error.message || "로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch {
      toast.error("올바른 이메일 형식이 아닙니다");
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast.error("비밀번호는 6자 이상이어야 합니다");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("이미 등록된 이메일입니다");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user && requestingEditor) {
        // Submit editor role request
        const { error: requestError } = await supabase.from("role_requests").insert({
          user_id: data.user.id,
          requested_role: "editor",
          status: "pending",
        });

        if (requestError) {
          console.error("Error submitting role request:", requestError);
        }
      }

      toast.success(
        requestingEditor 
          ? "회원가입 완료! Editor 역할 승인을 기다려주세요." 
          : "회원가입이 완료되었습니다"
      );
    } catch (error: any) {
      toast.error(error.message || "회원가입 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>LGE SAC Commissioning Report</CardTitle>
          <CardDescription>로그인하거나 새 계정을 만드세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "로그인 중..." : "로그인"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="비밀번호 (6자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requestEditor"
                    checked={requestingEditor}
                    onChange={(e) => setRequestingEditor(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="requestEditor" className="text-sm text-muted-foreground">
                    Editor 권한 신청 (관리자 승인 필요)
                  </label>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "가입 중..." : "회원가입"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <Button 
            variant="ghost" 
            className="w-full mt-4" 
            onClick={() => navigate("/")}
          >
            돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
