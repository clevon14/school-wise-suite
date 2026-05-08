import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Upload, FileText, Pencil, UserX, UserCheck } from "lucide-react";
import { CSVExportButton } from "@/components/CSVExportButton";
import { AddTeacherDialog } from "@/components/forms/AddTeacherDialog";
import { BulkTeacherImport } from "@/components/forms/BulkTeacherImport";
import { PrintableStaffForm } from "@/components/forms/PrintableStaffForm";
import { EditTeacherDialog } from "@/components/teachers/EditTeacherDialog";
import { ExitTeacherDialog } from "@/components/teachers/ExitTeacherDialog";
import { ReinstateTeacherDialog } from "@/components/teachers/ReinstateTeacherDialog";
import { LeaveManagement } from "@/components/teachers/LeaveManagement";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ACTIVE_STATUSES = ["active"];
const EXITED_STATUSES = ["resigned", "dismissed", "terminated", "retired", "on_leave"];

export default function Teachers() {
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [exitingTeacher, setExitingTeacher] = useState<any>(null);
  const [reinstatingTeacher, setReinstatingTeacher] = useState<any>(null);
  const [filter, setFilter] = useState<"active" | "exited" | "all">("active");

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = teachers?.filter((t) => {
    if (filter === "active") return ACTIVE_STATUSES.includes(t.status || "active");
    if (filter === "exited") return EXITED_STATUSES.includes(t.status || "");
    return true;
  });

  const statusBadge = (status: string | null) => {
    if (!status || status === "active") return <Badge variant="default">Active</Badge>;
    const labels: Record<string, string> = {
      resigned: "Resigned",
      dismissed: "Dismissed",
      terminated: "Terminated",
      retired: "Retired",
      on_leave: "On Leave",
    };
    return <Badge variant="secondary">{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Teachers</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage teacher records and assignments</p>
        </div>
        <div className="flex gap-2">
          <CSVExportButton data={teachers || []} type="teachers" />
          <PrintableStaffForm>
            <Button variant="outline" className="flex-1 md:flex-none">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Blank Form</span>
              <span className="sm:hidden">Form</span>
            </Button>
          </PrintableStaffForm>
          <BulkTeacherImport>
            <Button variant="outline" className="flex-1 md:flex-none">
              <Upload className="h-4 w-4 mr-2" />Import
            </Button>
          </BulkTeacherImport>
          <AddTeacherDialog>
            <Button className="flex-1 md:flex-none">
              <Plus className="h-4 w-4 mr-2" />Add Teacher
            </Button>
          </AddTeacherDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg md:text-xl">All Teachers</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="exited">Exited</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          {isLoading ? (
            <p className="px-4 md:px-0">Loading teachers...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Employee No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Exit Info</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((teacher) => {
                    const isExited = EXITED_STATUSES.includes(teacher.status || "");
                    return (
                      <TableRow key={teacher.id} className={isExited ? "opacity-60" : ""}>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={teacher.photo_url || undefined} />
                            <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{teacher.employee_number}</TableCell>
                        <TableCell>{teacher.first_name} {teacher.last_name}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.department || "-"}</TableCell>
                        <TableCell>{statusBadge(teacher.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                          {teacher.exit_date ? (
                            <div>
                              <div>{new Date(teacher.exit_date).toLocaleDateString()}</div>
                              {teacher.exit_reason && <div className="truncate" title={teacher.exit_reason}>{teacher.exit_reason}</div>}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setEditingTeacher(teacher)} title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isExited ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReinstatingTeacher(teacher)}
                                title="Reinstate"
                              >
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setExitingTeacher(teacher)}
                                title="Exit teacher"
                              >
                                <UserX className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No teachers in this view
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingTeacher && (
        <EditTeacherDialog
          teacher={editingTeacher}
          open={!!editingTeacher}
          onOpenChange={(open) => { if (!open) setEditingTeacher(null); }}
        />
      )}

      {exitingTeacher && (
        <ExitTeacherDialog
          teacher={exitingTeacher}
          open={!!exitingTeacher}
          onOpenChange={(open) => { if (!open) setExitingTeacher(null); }}
        />
      )}

      {reinstatingTeacher && (
        <ReinstateTeacherDialog
          teacher={reinstatingTeacher}
          open={!!reinstatingTeacher}
          onOpenChange={(open) => { if (!open) setReinstatingTeacher(null); }}
        />
      )}

      <LeaveManagement />
    </div>
  );
}
