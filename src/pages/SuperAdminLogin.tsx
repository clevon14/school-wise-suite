import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255, "Email too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password too long"),
});

export default function SuperAdminLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    // If already logged in as super admin, go straight to portal
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.rpc("is_super_admin", { p_user_id: session.user.id });
        if (data) {
          navigate("/select-school", { replace: true });
        }
      }
    };
    check();
  }, [navigate]);

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      // Verify super_admin role
      const { data: isSA, error: roleErr } = await supabase.rpc("is_super_admin", {
        p_user_id: data.user.id,
      });

      if (roleErr) throw roleErr;

      if (!isSA) {
        await supabase.auth.signOut();
        toast.error("Access denied. This login is for Super Admins only.");
        return;
      }

      toast.success("Welcome, Super Admin!");
      navigate("/select-school", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-destructive/5 p-4">
      <Card className="w-full max-w-md border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10 ring-2 ring-primary/20">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Super Admin Portal</CardTitle>
          <CardDescription>Restricted access — authorized personnel only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sa-email">Email</Label>
              <Input
                id="sa-email"
                type="email"
                placeholder="superadmin@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sa-password">Password</Label>
              <Input
                id="sa-password"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? "Verifying…" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
