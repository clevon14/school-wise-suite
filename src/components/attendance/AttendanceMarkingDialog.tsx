import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const attendanceSchema = z.object({
  date: z.date({ required_error: "Please select a date" }),
  class_id: z.string().min(1, "Please select a class"),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

type StudentAttendance = {
  student_id: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
};

export function AttendanceMarkingDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [studentAttendances, setStudentAttendances] = useState<Record<string, StudentAttendance>>({});
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const queryClient = useQueryClient();

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      date: new Date(),
      class_id: "",
    },
  });

  const selectedClassId = form.watch("class_id");

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

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["class-students", selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("class_id", selectedClassId)
        .eq("status", "active")
        .order("first_name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClassId,
  });

  // Check existing attendance for the selected date
  const { data: existingAttendance } = useQuery({
    queryKey: ["existing-attendance", form.watch("date"), selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      
      const dateStr = format(form.watch("date"), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance")
        .select("student_id, status, remarks")
        .eq("date", dateStr)
        .in("student_id", students?.map(s => s.id) || []);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClassId && !!students && students.length > 0,
  });

  // Initialize attendance from existing records
  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const attendanceMap: Record<string, StudentAttendance> = {};
      existingAttendance.forEach((record) => {
        attendanceMap[record.student_id] = {
          student_id: record.student_id,
          status: record.status as any,
          remarks: record.remarks || undefined,
        };
      });
      setStudentAttendances(attendanceMap);
    } else if (students) {
      // Initialize all as present by default
      const attendanceMap: Record<string, StudentAttendance> = {};
      students.forEach((student) => {
        attendanceMap[student.id] = {
          student_id: student.id,
          status: "present",
        };
      });
      setStudentAttendances(attendanceMap);
    }
  }, [existingAttendance, students]);

  const saveAttendance = useMutation({
    mutationFn: async (values: AttendanceFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dateStr = format(values.date, "yyyy-MM-dd");
      const attendanceRecords = Object.values(studentAttendances).map((attendance) => ({
        student_id: attendance.student_id,
        date: dateStr,
        status: attendance.status,
        remarks: attendance.remarks || null,
        marked_by: user.id,
      }));

      // Delete existing attendance for this date and students
      const { error: deleteError } = await supabase
        .from("attendance")
        .delete()
        .eq("date", dateStr)
        .in("student_id", attendanceRecords.map(r => r.student_id));

      if (deleteError) throw deleteError;

      // Insert new attendance records
      const { error: insertError } = await supabase
        .from("attendance")
        .insert(attendanceRecords);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["existing-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      toast.success("Attendance saved successfully");
      setOpen(false);
      form.reset();
      setStudentAttendances({});
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save attendance");
    },
  });

  const onSubmit = (values: AttendanceFormValues) => {
    if (Object.keys(studentAttendances).length === 0) {
      toast.error("No students selected");
      return;
    }
    saveAttendance.mutate(values);
  };

  const updateStatus = (studentId: string, status: StudentAttendance["status"]) => {
    setStudentAttendances((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        student_id: studentId,
        status,
      },
    }));
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setStudentAttendances((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: remarks || undefined,
      },
    }));
  };

  const applyBulkStatus = () => {
    if (!bulkStatus) return;
    
    const newAttendances: Record<string, StudentAttendance> = {};
    students?.forEach((student) => {
      newAttendances[student.id] = {
        student_id: student.id,
        status: bulkStatus as any,
      };
    });
    setStudentAttendances(newAttendances);
    toast.success(`All students marked as ${bulkStatus}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "late":
        return <Clock className="h-4 w-4 text-warning" />;
      case "excused":
        return <CheckCircle2 className="h-4 w-4 text-info" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "default";
      case "absent":
        return "destructive";
      case "late":
        return "secondary";
      case "excused":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Select date and class, then mark attendance for all students
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2020-01-01")
                          }
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} {cls.section || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedClassId && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Select value={bulkStatus} onValueChange={setBulkStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Bulk action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Mark all Present</SelectItem>
                      <SelectItem value="absent">Mark all Absent</SelectItem>
                      <SelectItem value="late">Mark all Late</SelectItem>
                      <SelectItem value="excused">Mark all Excused</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyBulkStatus}
                    disabled={!bulkStatus}
                  >
                    Apply to All
                  </Button>
                </div>

                {studentsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading students...</p>
                ) : students && students.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {students.map((student) => {
                      const attendance = studentAttendances[student.id];
                      const status = attendance?.status || "present";

                      return (
                        <div
                          key={student.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.admission_number}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {["present", "absent", "late", "excused"].map((statusOption) => (
                              <Button
                                key={statusOption}
                                type="button"
                                variant={status === statusOption ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateStatus(student.id, statusOption as any)}
                                className="min-w-[90px]"
                              >
                                {getStatusIcon(statusOption)}
                                <span className="ml-1 capitalize">{statusOption}</span>
                              </Button>
                            ))}
                          </div>

                          <Input
                            placeholder="Remarks (optional)"
                            value={attendance?.remarks || ""}
                            onChange={(e) => updateRemarks(student.id, e.target.value)}
                            className="w-[200px]"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No students found in this class
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Present: {Object.values(studentAttendances).filter(a => a.status === "present").length}
                </Badge>
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Absent: {Object.values(studentAttendances).filter(a => a.status === "absent").length}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Late: {Object.values(studentAttendances).filter(a => a.status === "late").length}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveAttendance.isPending || !selectedClassId}
                >
                  {saveAttendance.isPending ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
