import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Upload, FileText, Pencil } from "lucide-react";
import { CSVExportButton } from "@/components/CSVExportButton";
import { AddTeacherDialog } from "@/components/forms/AddTeacherDialog";
import { BulkTeacherImport } from "@/components/forms/BulkTeacherImport";
import { PrintableStaffForm } from "@/components/forms/PrintableStaffForm";
import { EditTeacherDialog } from "@/components/teachers/EditTeacherDialog";
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

export default function Teachers() {
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

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
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </BulkTeacherImport>
          <AddTeacherDialog>
            <Button className="flex-1 md:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Teacher</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </AddTeacherDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">All Teachers</CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          {isLoading ? (
            <p className="px-4 md:px-0">Loading teachers...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Employee No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers?.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={teacher.photo_url || undefined} alt={`${teacher.first_name} ${teacher.last_name}`} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{teacher.employee_number}</TableCell>
                    <TableCell>{`${teacher.first_name} ${teacher.last_name}`}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.department || "-"}</TableCell>
                    <TableCell className="capitalize">{teacher.role || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={teacher.status === "active" ? "default" : "secondary"}>
                        {teacher.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTeacher(teacher)}
                        title="Edit teacher"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
