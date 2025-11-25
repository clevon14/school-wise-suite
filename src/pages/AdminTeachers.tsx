import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Download, RefreshCw, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddTeacherDialog } from "@/components/admin/AddTeacherDialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface TeacherProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  class_id?: string;
  subjects?: string[];
  is_active: boolean;
  created_at: string;
  classes?: { name: string; section?: string };
}

export default function AdminTeachers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          classes:class_id(name, section)
        `)
        .eq("role", "teacher")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TeacherProfile[];
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast({
        title: "✓ Account Updated",
        description: "Teacher account status changed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update account status",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "✓ Reset Link Sent",
        description: "Teacher will receive password reset instructions via email",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    },
  });

  const exportToCSV = () => {
    if (!teachers || teachers.length === 0) {
      toast({
        title: "No Teachers Yet",
        description: "Create teacher accounts first to export them",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Full Name", "Username", "Email", "Class", "Subjects", "Status", "Created"];
    const rows = teachers.map((t) => [
      t.full_name,
      t.username,
      t.email,
      t.classes ? `${t.classes.name}${t.classes.section ? ` - ${t.classes.section}` : ""}` : "-",
      t.subjects?.join(", ") || "-",
      t.is_active ? "Active" : "Disabled",
      new Date(t.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "✓ Export Complete",
      description: `${teachers.length} teacher records downloaded`,
    });
  };

  const filteredTeachers = teachers?.filter((teacher) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      teacher.full_name.toLowerCase().includes(searchLower) ||
      teacher.username.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Teacher Accounts</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {teachers?.length ? `${teachers.length} teacher accounts` : "Create your first teacher account"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={exportToCSV} className="h-11">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="h-11">
            <Plus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          {isLoading ? (
            <p className="px-4 md:px-0">Loading teachers...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers?.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.full_name}</TableCell>
                      <TableCell>{teacher.username}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>
                        {teacher.classes
                          ? `${teacher.classes.name}${teacher.classes.section ? ` - ${teacher.classes.section}` : ""}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {teacher.subjects && teacher.subjects.length > 0
                          ? teacher.subjects.join(", ")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={teacher.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({
                                id: teacher.id,
                                is_active: checked,
                              })
                            }
                          />
                          <Badge variant={teacher.is_active ? "default" : "secondary"}>
                            {teacher.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9"
                          onClick={() => resetPasswordMutation.mutate(teacher.email)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span className="hidden lg:inline">Reset Password</span>
                          <span className="lg:hidden">Reset</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTeachers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No teachers match your search" : "No teacher accounts yet — create your first one!"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddTeacherDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
}
