import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  homeworkId: string;
  classId: string;
  schoolId: string | null;
  maxMarks: number | null;
}

interface Row {
  student_id: string;
  student_name: string;
  admission_number: string;
  submission_id: string | null;
  submission_text: string | null;
  submitted_at: string | null;
  status: string;
  is_late: boolean;
  marks_awarded: number | null;
  feedback: string | null;
  // local edits
  edit_marks: string;
  edit_feedback: string;
  dirty?: boolean;
}

export function SubmissionsTable({ homeworkId, classId, schoolId, maxMarks }: Props) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["homework-submissions", homeworkId],
    queryFn: async () => {
      const [{ data: students, error: e1 }, { data: subs, error: e2 }] = await Promise.all([
        supabase.from("students")
          .select("id, first_name, last_name, admission_number")
          .eq("class_id", classId)
          .eq("status", "active")
          .order("first_name"),
        supabase.from("homework_submissions").select("*").eq("homework_id", homeworkId),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { students: students || [], subs: subs || [] };
    },
  });

  useEffect(() => {
    if (!data) return;
    const subMap = new Map(data.subs.map((s: any) => [s.student_id, s]));
    setRows(data.students.map((s: any) => {
      const sub: any = subMap.get(s.id);
      return {
        student_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        admission_number: s.admission_number ?? "",
        submission_id: sub?.id ?? null,
        submission_text: sub?.submission_text ?? null,
        submitted_at: sub?.submitted_at ?? null,
        status: sub?.status ?? "not_started",
        is_late: sub?.is_late ?? false,
        marks_awarded: sub?.marks_awarded ?? null,
        feedback: sub?.feedback ?? null,
        edit_marks: sub?.marks_awarded?.toString() ?? "",
        edit_feedback: sub?.feedback ?? "",
        dirty: false,
      };
    }));
  }, [data]);

  const saveOne = useMutation({
    mutationFn: async (row: Row) => {
      const marks = row.edit_marks === "" ? null : Number(row.edit_marks);
      if (marks !== null && Number.isNaN(marks)) throw new Error("Marks must be a number");
      if (maxMarks && marks !== null && marks > maxMarks) throw new Error(`Marks cannot exceed ${maxMarks}`);

      const { data: { user } } = await supabase.auth.getUser();
      // resolve graded_by to employee id
      const { data: emp } = await supabase.from("employees").select("id").eq("user_id", user?.id).maybeSingle();

      if (row.submission_id) {
        const { error } = await supabase.from("homework_submissions").update({
          marks_awarded: marks,
          feedback: row.edit_feedback || null,
          graded_by: emp?.id ?? null,
        }).eq("id", row.submission_id);
        if (error) throw error;
      } else {
        // Create a graded shell so admin can mark even without submission
        const { error } = await supabase.from("homework_submissions").insert({
          homework_id: homeworkId,
          student_id: row.student_id,
          school_id: schoolId,
          marks_awarded: marks,
          feedback: row.edit_feedback || null,
          graded_by: emp?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["homework-submissions", homeworkId] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  function updateRow(idx: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch, dirty: true } : r));
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading submissions…</div>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Submission</TableHead>
            <TableHead className="w-[110px]">Marks{maxMarks ? ` / ${maxMarks}` : ""}</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.student_id}>
              <TableCell>
                <div className="font-medium">{r.student_name}</div>
                <div className="text-xs text-muted-foreground">{r.admission_number}</div>
              </TableCell>
              <TableCell>
                <Badge variant={
                  r.status === "graded" ? "default"
                  : r.status === "submitted" ? "secondary"
                  : r.status === "late" ? "destructive"
                  : "outline"
                }>{r.status.replace("_", " ")}</Badge>
              </TableCell>
              <TableCell className="text-xs">
                {r.submitted_at ? format(new Date(r.submitted_at), "dd MMM, HH:mm") : "—"}
              </TableCell>
              <TableCell className="max-w-[260px]">
                <div className="text-xs whitespace-pre-wrap line-clamp-3">
                  {r.submission_text || <span className="text-muted-foreground">No text</span>}
                </div>
              </TableCell>
              <TableCell>
                <Input
                  className="h-8"
                  type="number"
                  min="0"
                  value={r.edit_marks}
                  onChange={(e) => updateRow(i, { edit_marks: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Textarea
                  className="min-h-[40px]"
                  rows={2}
                  value={r.edit_feedback}
                  onChange={(e) => updateRow(i, { edit_feedback: e.target.value })}
                />
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={r.dirty ? "default" : "outline"}
                  onClick={() => saveOne.mutate(r)}
                  disabled={saveOne.isPending}
                >
                  {saveOne.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                No students in this class.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
