import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserX, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkEntry {
  id?: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

interface InlineMarksEntryProps {
  examSubjectId: string;
  subjectName: string;
  maxMarks: number;
  passMarks: number;
}

export function InlineMarksEntry({ examSubjectId, subjectName, maxMarks, passMarks }: InlineMarksEntryProps) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch exam subject and resolve class_id via exam
  const { data: classId } = useQuery({
    queryKey: ["exam-subject-class", examSubjectId],
    queryFn: async () => {
      const { data: es, error: esErr } = await supabase
        .from("exam_subjects")
        .select("exam_id")
        .eq("id", examSubjectId)
        .single();
      if (esErr) throw esErr;

      const { data: exam, error: examErr } = await supabase
        .from("exams")
        .select("class_id")
        .eq("id", es.exam_id)
        .single();
      if (examErr) throw examErr;
      return exam.class_id as string | null;
    },
  });

  const { data: studentsData, isLoading } = useQuery({
    queryKey: ["students-marks-inline", examSubjectId, classId],
    queryFn: async () => {
      if (!classId) return [];

      const [studentsRes, existingMarksRes] = await Promise.all([
        supabase
          .from("students")
          .select("id, first_name, last_name, admission_number")
          .eq("class_id", classId)
          .eq("status", "active")
          .order("first_name"),
        supabase
          .from("marks")
          .select("*")
          .eq("exam_subject_id", examSubjectId),
      ]);

      if (studentsRes.error) throw studentsRes.error;

      return (studentsRes.data || []).map((student) => {
        const existing = existingMarksRes.data?.find(m => m.student_id === student.id);
        return {
          id: existing?.id,
          student_id: student.id,
          student_name: `${student.first_name} ${student.last_name}`,
          admission_number: student.admission_number || "",
          marks_obtained: existing?.marks_obtained ?? null,
          is_absent: existing?.is_absent ?? false,
        };
      });
    },
    enabled: !!classId,
  });

  useEffect(() => {
    if (studentsData) setMarks(studentsData);
  }, [studentsData]);

  const saveMarksMutation = useMutation({
    mutationFn: async () => {
      // Delete existing and re-insert
      await supabase.from("marks").delete().eq("exam_subject_id", examSubjectId);
      const toInsert = marks.map(m => ({
        student_id: m.student_id,
        exam_subject_id: examSubjectId,
        marks_obtained: m.is_absent ? null : m.marks_obtained,
        is_absent: m.is_absent,
      }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from("marks").insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks"] });
      queryClient.invalidateQueries({ queryKey: ["students-marks-inline", examSubjectId] });
      queryClient.invalidateQueries({ queryKey: ["student-exam-marks"] });
      toast.success(`Marks saved for ${subjectName}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save marks");
    },
  });

  const updateMark = (index: number, field: "marks_obtained" | "is_absent", value: any) => {
    setMarks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "is_absent" && value === true) {
        updated[index].marks_obtained = null;
      }
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      let next = index + 1;
      while (next < marks.length && marks[next].is_absent) next++;
      if (next < marks.length) inputRefs.current[next]?.focus();
    }
  };

  const entered = marks.filter(m => !m.is_absent && m.marks_obtained !== null).length;
  const absentCount = marks.filter(m => m.is_absent).length;
  const avgScore = entered > 0
    ? (marks.filter(m => !m.is_absent && m.marks_obtained !== null)
        .reduce((sum, m) => sum + (m.marks_obtained || 0), 0) / entered).toFixed(1)
    : null;

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading students...</div>;
  }

  if (marks.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No active students found in this class.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Max: <span className="font-semibold text-foreground">{maxMarks}</span>
        </span>
        <span className="text-sm text-muted-foreground">
          Pass: <span className="font-semibold text-foreground">{passMarks}</span>
        </span>
        <Badge variant="outline">{entered + absentCount}/{marks.length} marked</Badge>
        {absentCount > 0 && <Badge variant="secondary">{absentCount} absent</Badge>}
        {avgScore && <Badge>Avg: {avgScore}</Badge>}
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => saveMarksMutation.mutate()}
            disabled={saveMarksMutation.isPending}
          >
            <Save className="h-3 w-3 mr-1" />
            {saveMarksMutation.isPending ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-28">Adm. No.</TableHead>
              <TableHead className="w-36">
                Marks <span className="text-muted-foreground font-normal">/ {maxMarks}</span>
              </TableHead>
              <TableHead className="w-20 text-center">%</TableHead>
              <TableHead className="w-20 text-center">Absent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marks.map((mark, index) => {
              const pct = mark.marks_obtained !== null && maxMarks > 0
                ? Math.round((mark.marks_obtained / maxMarks) * 100)
                : null;
              const passed = mark.marks_obtained !== null && mark.marks_obtained >= passMarks;
              return (
                <TableRow
                  key={mark.student_id}
                  className={cn(mark.is_absent && "opacity-50 bg-muted/20")}
                >
                  <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                  <TableCell className="font-medium text-sm">{mark.student_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{mark.admission_number}</TableCell>
                  <TableCell>
                    <Input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="number"
                      min="0"
                      max={maxMarks}
                      value={mark.marks_obtained ?? ""}
                      onChange={(e) =>
                        updateMark(index, "marks_obtained",
                          e.target.value === "" ? null : parseFloat(e.target.value)
                        )
                      }
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      disabled={mark.is_absent}
                      className="h-8 w-24 text-center"
                      placeholder="—"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {mark.is_absent ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : pct !== null ? (
                      <span className={cn(
                        "text-xs font-semibold",
                        passed ? "text-primary" : "text-destructive"
                      )}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      onClick={() => updateMark(index, "is_absent", !mark.is_absent)}
                      className={cn(
                        "rounded-full p-1 transition-colors",
                        mark.is_absent
                          ? "text-destructive"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={mark.is_absent ? "Mark present" : "Mark absent"}
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
      <p className="text-xs text-muted-foreground">Tip: Press Tab or Enter to move to the next student</p>
    </div>
  );
}
