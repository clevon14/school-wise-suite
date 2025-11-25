import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTestDialog({ open, onOpenChange }: CreateTestDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    class_id: "",
    subject_id: "",
    test_date: "",
    max_marks: "",
    pass_marks: "",
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Create test mutation
  const createTestMutation = useMutation({
    mutationFn: async () => {
      // First create the test
      const { data: test, error: testError } = await supabase
        .from("tests")
        .insert({
          name: formData.name,
          class_id: formData.class_id,
          subject_id: formData.subject_id,
          test_date: formData.test_date,
          max_marks: parseInt(formData.max_marks),
          pass_marks: parseInt(formData.pass_marks),
          academic_year: formData.academic_year,
        })
        .select()
        .single();

      if (testError) throw testError;

      // Get all students in the class
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", formData.class_id)
        .eq("status", "active");

      if (studentsError) throw studentsError;

      // Create test_results entries for all students
      if (students && students.length > 0) {
        const results = students.map((student) => ({
          test_id: test.id,
          student_id: student.id,
          is_absent: false,
          marks_obtained: null,
        }));

        const { error: resultsError } = await supabase
          .from("test_results")
          .insert(results);

        if (resultsError) throw resultsError;
      }

      return test;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Test created successfully");
      onOpenChange(false);
      setFormData({
        name: "",
        class_id: "",
        subject_id: "",
        test_date: "",
        max_marks: "",
        pass_marks: "",
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      });
    },
    onError: (error) => {
      toast.error("Failed to create test");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.class_id || !formData.subject_id || !formData.test_date || !formData.max_marks || !formData.pass_marks) {
      toast.error("Please fill in all required fields");
      return;
    }
    createTestMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Test Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mid-Term Exam"
              required
            />
          </div>

          <div>
            <Label htmlFor="class">Class *</Label>
            <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `(${cls.section})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="test_date">Test Date *</Label>
            <Input
              id="test_date"
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_marks">Max Marks *</Label>
              <Input
                id="max_marks"
                type="number"
                min="1"
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                placeholder="100"
                required
              />
            </div>

            <div>
              <Label htmlFor="pass_marks">Pass Marks *</Label>
              <Input
                id="pass_marks"
                type="number"
                min="1"
                value={formData.pass_marks}
                onChange={(e) => setFormData({ ...formData, pass_marks: e.target.value })}
                placeholder="40"
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTestMutation.isPending}>
              {createTestMutation.isPending ? "Creating..." : "Create Test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
