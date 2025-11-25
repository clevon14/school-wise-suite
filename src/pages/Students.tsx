import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground">Manage student records and information</p>
        </div>
        <div className="flex gap-2">
          <CSVExportButton data={students || []} type="students" />
          <AddStudentDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </AddStudentDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading students...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Parent Contact</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
