import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";

export default function TeacherLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert username to email format
      const email = `${username.toLowerCase()}@school.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed");
      }

      // Check if user is a teacher
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== "teacher") {
        await supabase.auth.signOut();
        throw new Error("This login is for teachers only");
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        throw new Error("Your account has been disabled. Please contact administration.");
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Teacher Login</CardTitle>
          <CardDescription className="text-base">
            Holy Cross School Staff Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="h-12 text-base"
              />
              <p className="text-xs text-muted-foreground">
                Your username (not email address)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="link"
                className="text-sm"
                onClick={() => navigate("/auth")}
              >
                Admin Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
