import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Download } from "lucide-react";
import { CSVExportButton } from "@/components/CSVExportButton";
import { AddStudentDialog } from "@/components/forms/AddStudentDialog";
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
import { exportToCSV } from "@/lib/csv-export-client";
import { toast } from "sonner";

export default function Students() {
  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes:class_id (
            name,
            section
          )
        `)
        .order("first_name");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {students?.length ? `${students.length} students enrolled` : "Loading students..."}
          </p>
        </div>
        <div className="flex gap-2">
          <CSVExportButton data={students || []} type="students" />
          <AddStudentDialog>
            <Button className="flex-1 md:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Student</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </AddStudentDialog>
        </div>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">All Students</CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          {isLoading ? (
            <p className="px-4 md:px-0">Loading students...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parent Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.photo_url || undefined} alt={`${student.first_name} ${student.last_name}`} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{student.admission_number}</TableCell>
                    <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                    <TableCell>
                      {student.classes 
                        ? `${student.classes.name} ${student.classes.section || ""}`
                        : "Not Assigned"
                      }
                    </TableCell>
                    <TableCell className="capitalize">{student.gender || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === "active" ? "default" : "secondary"}>
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.parent_phone || "-"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await exportToCSV({
                              scope: 'student',
                              id: student.id,
                            });
                            toast.success("Student report exported");
                          } catch (error) {
                            toast.error("Failed to export student report");
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
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
    </div>
  );
}
