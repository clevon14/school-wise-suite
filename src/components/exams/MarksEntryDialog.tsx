import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MarkEntry {
  student_id: string;
  student_name: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

export function MarksEntryDialog({ examSubjectId, children }: { examSubjectId: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const queryClient = useQueryClient();

  const { data: examSubject } = useQuery({
    queryKey: ["exam-subject", examSubjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_subjects")
        .select("*, subjects(name), exam_id, max_marks, pass_marks")
        .eq("id", examSubjectId)
        .single();
      if (error) throw error;

      // Resolve class_id separately
      const { data: exam } = await supabase
        .from("exams")
        .select("class_id")
        .eq("id", data.exam_id)
        .single();

      return { ...data, class_id: exam?.class_id ?? null };
    },
    enabled: open,
  });

  const { data: students } = useQuery({
    queryKey: ["students-for-marks", examSubject?.class_id],
    queryFn: async () => {
      if (!examSubject?.class_id) return [];
      
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name")
        .eq("class_id", examSubject.class_id)
        .eq("status", "active")
        .order("first_name");
      
      if (error) throw error;
      
      // Fetch existing marks
      const { data: existingMarks } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_subject_id", examSubjectId);
      
      return data.map(student => {
        const existing = existingMarks?.find(m => m.student_id === student.id);
        return {
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          marks_obtained: existing?.marks_obtained || null,
          is_absent: existing?.is_absent || false,
        };
      });
    },
    enabled: !!examSubject,
  });

  const saveMarksMutation = useMutation({
    mutationFn: async () => {
      const marksData = marks.map(m => ({
        student_id: m.student_id,
        exam_subject_id: examSubjectId,
        marks_obtained: m.is_absent ? null : m.marks_obtained,
        is_absent: m.is_absent,
      }));

      // Delete existing marks first
      await supabase.from("marks").delete().eq("exam_subject_id", examSubjectId);
      
      // Insert new marks
      const { error } = await supabase.from("marks").insert(marksData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      toast.success("Marks saved successfully");
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save marks");
    },
  });

  const updateMark = (studentId: string, field: "marks_obtained" | "is_absent", value: any) => {
    setMarks(prev => {
      const updated = prev.map(m =>
        m.student_id === studentId ? { ...m, [field]: value } : m
      );
      return updated;
    });
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && students) {
      setMarks(students);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Enter Marks - {examSubject?.subjects?.name} (Max: {examSubject?.max_marks})
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Marks Obtained</TableHead>
                <TableHead>Absent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((mark) => (
                <TableRow key={mark.student_id}>
                  <TableCell>{mark.student_name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      max={examSubject?.max_marks}
                      value={mark.is_absent ? "" : mark.marks_obtained || ""}
                      onChange={(e) => updateMark(mark.student_id, "marks_obtained", parseFloat(e.target.value))}
                      disabled={mark.is_absent}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={mark.is_absent}
                      onCheckedChange={(checked) => updateMark(mark.student_id, "is_absent", checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMarksMutation.mutate()} disabled={saveMarksMutation.isPending}>
            {saveMarksMutation.isPending ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
