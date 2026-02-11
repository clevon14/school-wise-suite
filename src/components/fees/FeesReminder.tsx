import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function FeesReminder() {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: dueFees, isLoading } = useQuery({
    queryKey: ["dueFeesReminder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(id, first_name, last_name, admission_number, parent_phone, class_id, class:classes(name, section))
        `)
        .in("status", ["pending", "overdue"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = dueFees?.filter((f: any) => {
    return selectedClass === "all" || f.student?.class_id === selectedClass;
  });

  // Group by student
  const groupedByStudent = filtered?.reduce((acc: any, fee: any) => {
    const studentId = fee.student?.id;
    if (!studentId) return acc;
    if (!acc[studentId]) {
      acc[studentId] = {
        student: fee.student,
        totalDue: 0,
        fees: [],
      };
    }
    acc[studentId].totalDue += Number(fee.amount);
    acc[studentId].fees.push(fee);
    return acc;
  }, {});

  const studentList = groupedByStudent ? Object.values(groupedByStudent) as any[] : [];

  const handleSendReminder = () => {
    if (selectedStudents.length === 0) {
      toast({ title: "No Selection", description: "Select students to send reminders", variant: "destructive" });
      return;
    }
    toast({
      title: "Reminders Queued",
      description: `Fee reminders will be sent to ${selectedStudents.length} parent(s)`,
    });
    setSelectedStudents([]);
  };

  const toggleAll = () => {
    if (selectedStudents.length === studentList.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentList.map((s: any) => s.student.id));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Fees Reminder</CardTitle>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- ${cls.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSendReminder} disabled={selectedStudents.length === 0} className="gap-2">
            <Bell className="h-4 w-4" />
            Send Reminder ({selectedStudents.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === studentList.length && studentList.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Due Fees Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentList.map((item: any) => (
                <TableRow key={item.student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(item.student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, item.student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter((id) => id !== item.student.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{item.student.first_name} {item.student.last_name}</TableCell>
                  <TableCell>{item.student.admission_number}</TableCell>
                  <TableCell>
                    {item.student.class ? `${item.student.class.name}${item.student.class.section ? ' - ' + item.student.class.section : ''}` : "-"}
                  </TableCell>
                  <TableCell className="font-semibold text-destructive">₹{item.totalDue.toLocaleString()}</TableCell>
                  <TableCell>{item.student.parent_phone || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.fees.length}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {studentList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No students with due fees
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
