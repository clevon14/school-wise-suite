import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserX, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkEntry {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

interface EnterMarksDialogProps {
  testId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnterMarksDialog({ testId, open, onOpenChange }: EnterMarksDialogProps) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ["test-results-entry", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select(`
          *,
          students:student_id(
            id,
            first_name,
            last_name,
            admission_number
          )
        `)
        .eq("test_id", testId)
        .order("students(first_name)");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (results) {
      setMarks(
        results.map((result: any) => ({
          id: result.id,
          student_id: result.student_id,
          student_name: `${result.students?.first_name} ${result.students?.last_name}`,
          admission_number: result.students?.admission_number || "",
          marks_obtained: result.marks_obtained,
          is_absent: result.is_absent || false,
        }))
      );
    }
  }, [results]);

  const saveMarksMutation = useMutation({
    mutationFn: async () => {
      const updates = marks.map((mark) =>
        supabase
          .from("test_results")
          .update({
            marks_obtained: mark.is_absent ? null : mark.marks_obtained,
            is_absent: mark.is_absent,
          })
          .eq("id", mark.id)
      );
      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-results", testId] });
      queryClient.invalidateQueries({ queryKey: ["test-stats", testId] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Marks saved successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to save marks");
      console.error(error);
    },
  });

  const updateMark = (index: number, field: keyof MarkEntry, value: any) => {
    setMarks((prev) => {
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
      // Find next non-absent student
      let next = index + 1;
      while (next < marks.length && marks[next].is_absent) next++;
      if (next < marks.length) {
        inputRefs.current[next]?.focus();
      }
    }
  };

  // Stats
  const entered = marks.filter(m => !m.is_absent && m.marks_obtained !== null).length;
  const absentCount = marks.filter(m => m.is_absent).length;
  const totalMarked = entered + absentCount;
  const avgScore = entered > 0
    ? (marks.filter(m => !m.is_absent && m.marks_obtained !== null)
        .reduce((sum, m) => sum + (m.marks_obtained || 0), 0) / entered).toFixed(1)
    : null;

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">{test.name} — Enter Marks</DialogTitle>
          <div className="flex flex-wrap gap-3 text-sm pt-1">
            <span className="text-muted-foreground">Max: <span className="font-semibold text-foreground">{test.max_marks}</span></span>
            <span className="text-muted-foreground">Pass: <span className="font-semibold text-foreground">{test.pass_marks}</span></span>
            <Badge variant="outline">{totalMarked}/{marks.length} marked</Badge>
            {absentCount > 0 && <Badge variant="secondary">{absentCount} absent</Badge>}
            {avgScore && <Badge variant="default">Avg: {avgScore}</Badge>}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading students...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-32">Adm. No.</TableHead>
                  <TableHead className="w-36">Marks <span className="text-muted-foreground font-normal">/ {test.max_marks}</span></TableHead>
                  <TableHead className="w-24 text-center">Grade</TableHead>
                  <TableHead className="w-24 text-center">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((mark, index) => {
                  const pct = mark.marks_obtained !== null && test.max_marks > 0
                    ? Math.round((mark.marks_obtained / test.max_marks) * 100)
                    : null;
                  const passed = mark.marks_obtained !== null && mark.marks_obtained >= test.pass_marks;
                  return (
                    <TableRow
                      key={mark.id}
                      className={cn(
                        mark.is_absent && "opacity-50 bg-muted/30"
                      )}
                    >
                      <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium">{mark.student_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{mark.admission_number}</TableCell>
                      <TableCell>
                        <Input
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="number"
                          min="0"
                          max={test.max_marks}
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
                          <Badge variant="secondary" className="text-xs">Absent</Badge>
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
                              ? "text-destructive hover:text-destructive/70"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          title={mark.is_absent ? "Mark as present" : "Mark as absent"}
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2 border-t">
          <div className="flex-1 text-xs text-muted-foreground">
            Tip: Press Tab or Enter to move to next student
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => saveMarksMutation.mutate()} disabled={saveMarksMutation.isPending}>
            {saveMarksMutation.isPending ? "Saving..." : "Save Marks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
