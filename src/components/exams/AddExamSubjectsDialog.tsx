import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface ExamSubject {
  subject_id: string;
  max_marks: number;
  pass_marks: number;
  exam_date: string;
}

export function AddExamSubjectsDialog({ examId, children }: { examId: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const queryClient = useQueryClient();

  const { data: availableSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const addSubjectMutation = useMutation({
    mutationFn: async (examSubjects: ExamSubject[]) => {
      const { error } = await supabase
        .from("exam_subjects")
        .insert(examSubjects.map(s => ({ exam_id: examId, ...s })));
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-subjects", examId] });
      toast.success("Subjects added successfully");
      setSubjects([]);
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add subjects");
    },
  });

  const addSubject = () => {
    setSubjects([...subjects, { subject_id: "", max_marks: 100, pass_marks: 33, exam_date: "" }]);
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: keyof ExamSubject, value: any) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  const handleSubmit = () => {
    if (subjects.some(s => !s.subject_id || !s.exam_date)) {
      toast.error("Please fill in all fields");
      return;
    }
    addSubjectMutation.mutate(subjects);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exam Subjects</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {subjects.map((subject, index) => (
            <div key={index} className="grid grid-cols-5 gap-2 items-end p-3 border rounded-lg">
              <div>
                <Label>Subject</Label>
                <Select
                  value={subject.subject_id}
                  onValueChange={(value) => updateSubject(index, "subject_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Max Marks</Label>
                <Input
                  type="number"
                  value={subject.max_marks}
                  onChange={(e) => updateSubject(index, "max_marks", parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label>Pass Marks</Label>
                <Input
                  type="number"
                  value={subject.pass_marks}
                  onChange={(e) => updateSubject(index, "pass_marks", parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label>Exam Date</Label>
                <Input
                  type="date"
                  value={subject.exam_date}
                  onChange={(e) => updateSubject(index, "exam_date", e.target.value)}
                />
              </div>

              <Button variant="ghost" size="icon" onClick={() => removeSubject(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" onClick={addSubject} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addSubjectMutation.isPending || subjects.length === 0}>
            {addSubjectMutation.isPending ? "Saving..." : "Save Subjects"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
