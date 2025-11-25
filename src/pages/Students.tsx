import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, User, Download, Trash2, UserX } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportToCSV } from "@/lib/csv-export-client";
import { toast } from "sonner";

export default function Students() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const queryClient = useQueryClient();
  const { data: allStudents, isLoading } = useQuery({
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

  const students = allStudents?.filter(s => 
    activeTab === "active" ? s.status === "active" : s.status === "transferred"
  ) || [];

  const bulkDelete = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const { error } = await supabase
        .from("students")
        .delete()
        .in("id", studentIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Students deleted successfully");
      setSelectedStudents([]);
      setShowDeleteDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete students");
    },
  });

  const transferStudents = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const { error } = await supabase
        .from("students")
        .update({ status: "transferred" })
        .in("id", studentIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Students transferred successfully");
      setSelectedStudents([]);
      setShowTransferDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to transfer students");
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {allStudents?.length ? `${allStudents.length} students total` : "Loading students..."}
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

      {selectedStudents.length > 0 && (
        <Card className="bg-muted">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                {activeTab === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransferDialog(true)}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">
            Active Students ({allStudents?.filter(s => s.status === "active").length || 0})
          </TabsTrigger>
          <TabsTrigger value="transferred">
            Transferred ({allStudents?.filter(s => s.status === "transferred").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl">
                {activeTab === "active" ? "Active Students" : "Transferred Students"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 md:px-6">
              {isLoading ? (
                <p className="px-4 md:px-0">Loading students...</p>
              ) : students.length === 0 ? (
                <p className="px-4 md:px-0 text-muted-foreground">No students found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[640px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedStudents.length === students.length && students.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
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
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => 
                                handleSelectStudent(student.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Avatar className="h-10 w-10">
                              <AvatarImage 
                                src={student.photo_url || undefined} 
                                alt={`${student.first_name} ${student.last_name}`} 
                              />
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
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate(selectedStudents)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer Confirmation Dialog */}
      <AlertDialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Students</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} as transferred? 
              They will be moved to the transferred students section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => transferStudents.mutate(selectedStudents)}>
              Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
