import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { exportAttendance } from "@/lib/csv-export";
import { EditAttendanceDialog } from "./EditAttendanceDialog";
import { toast } from "sonner";

export function AttendanceReport() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance-report", selectedDate, selectedClass],
    queryFn: async () => {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      let query = supabase
        .from("attendance")
        .select(`
          *,
          student:students(
            id,
            first_name,
            last_name,
            admission_number,
            class:classes(name, section)
          )
        `)
        .eq("date", dateStr)
        .order("student(first_name)");

      if (selectedClass) {
        const { data: students } = await supabase
          .from("students")
          .select("id")
          .eq("class_id", selectedClass);
        
        if (students && students.length > 0) {
          query = query.in("student_id", students.map(s => s.id));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      present: "default",
      absent: "destructive",
      late: "secondary",
      excused: "outline",
    };
    return variants[status] || "outline";
  };

  const handleExport = () => {
    if (attendance && attendance.length > 0) {
      exportAttendance(attendance);
    }
  };

  const deleteAttendance = useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", recordId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-report"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      toast.success("Attendance record deleted successfully");
      setDeleteRecordId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete attendance record");
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attendance Report</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!attendance || attendance.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) =>
                  date > new Date() || date < new Date("2020-01-01")
                }
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Select value={selectedClass || "all"} onValueChange={(value) => setSelectedClass(value === "all" ? "" : value)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section || ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading attendance...</p>
        ) : attendance && attendance.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.student?.first_name} {record.student?.last_name}
                  </TableCell>
                  <TableCell>{record.student?.admission_number}</TableCell>
                  <TableCell>
                    {record.student?.class
                      ? `${record.student.class.name} ${record.student.class.section || ""}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {record.remarks || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditRecord(record)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteRecordId(record.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No attendance records found for the selected date and class
          </p>
        )}
      </CardContent>

      <EditAttendanceDialog
        record={editRecord}
        open={!!editRecord}
        onOpenChange={(open) => !open && setEditRecord(null)}
      />

      <AlertDialog
        open={!!deleteRecordId}
        onOpenChange={(open) => !open && setDeleteRecordId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecordId && deleteAttendance.mutate(deleteRecordId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAttendance.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
