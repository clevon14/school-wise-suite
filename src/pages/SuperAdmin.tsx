import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus, Users, GraduationCap, Settings } from "lucide-react";
import { CreateSchoolDialog } from "@/components/super-admin/CreateSchoolDialog";
import { SchoolCard } from "@/components/super-admin/SchoolCard";
import { toast } from "sonner";

export default function SuperAdmin() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const { error } = await supabase.from("schools").delete().eq("id", schoolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
      toast.success("School deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Super Admin Portal
            </h1>
            <p className="text-muted-foreground mt-1">Manage all schools in the system</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add School
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Schools</CardDescription>
              <CardTitle className="text-3xl">{schools.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Schools</CardDescription>
              <CardTitle className="text-3xl">
                {schools.filter((s: any) => s.status === "active").length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Inactive Schools</CardDescription>
              <CardTitle className="text-3xl">
                {schools.filter((s: any) => s.status !== "active").length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading schools...</div>
        ) : schools.length === 0 ? (
          <Card className="text-center p-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schools Yet</h3>
            <p className="text-muted-foreground mb-4">Create your first school to get started</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create School
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schools.map((school: any) => (
              <SchoolCard
                key={school.id}
                school={school}
                onDelete={() => deleteMutation.mutate(school.id)}
              />
            ))}
          </div>
        )}

        <CreateSchoolDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </div>
  );
}
