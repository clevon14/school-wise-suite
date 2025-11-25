import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // Fetch test details
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

  // Fetch existing results
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

  // Initialize marks state when data loads
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

  // Save marks mutation
  const saveMarksMutation = useMutation({
    mutationFn: async () => {
      // Update each result individually
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
      
      if (errors.length > 0) {
        throw errors[0].error;
      }
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
      // If marking absent, clear marks
      if (field === "is_absent" && value === true) {
        updated[index].marks_obtained = null;
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    saveMarksMutation.mutate();
  };

  if (!test) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Enter Marks - {test.name}</DialogTitle>
          <div className="text-sm text-muted-foreground">
            Max Marks: {test.max_marks} | Pass Marks: {test.pass_marks}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead className="w-32">Marks</TableHead>
                  <TableHead className="w-24">Absent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marks.map((mark, index) => (
                  <TableRow key={mark.id}>
                    <TableCell className="font-medium">{mark.student_name}</TableCell>
                    <TableCell>{mark.admission_number}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={test.max_marks}
                        value={mark.marks_obtained ?? ""}
                        onChange={(e) =>
                          updateMark(
                            index,
                            "marks_obtained",
                            e.target.value === "" ? null : parseFloat(e.target.value)
                          )
                        }
                        disabled={mark.is_absent}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={mark.is_absent}
                        onCheckedChange={(checked) =>
                          updateMark(index, "is_absent", checked === true)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saveMarksMutation.isPending}>
            {saveMarksMutation.isPending ? "Saving..." : "Save Marks"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
