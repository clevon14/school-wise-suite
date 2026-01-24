import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, RotateCcw } from "lucide-react";

interface PromoteStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudents: string[];
  students: any[];
  onSuccess: () => void;
}

export function PromoteStudentsDialog({
  open,
  onOpenChange,
  selectedStudents,
  students,
  onSuccess,
}: PromoteStudentsDialogProps) {
  const [action, setAction] = useState<"promote" | "retain">("promote");
  const [targetClassId, setTargetClassId] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section, academic_year")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const selectedStudentDetails = students.filter((s) =>
    selectedStudents.includes(s.id)
  );

  const promoteStudents = useMutation({
    mutationFn: async () => {
      if (action === "promote" && !targetClassId) {
        throw new Error("Please select a target class");
      }

      const { data: { user } } = await supabase.auth.getUser();
      const currentYear = new Date().getFullYear().toString();

      // Update students
      if (action === "promote") {
        const { error } = await supabase
          .from("students")
          .update({ class_id: targetClassId })
          .in("id", selectedStudents);
        if (error) throw error;
      }

      // Log promotion history for each student
      const historyRecords = selectedStudentDetails.map((student) => ({
        student_id: student.id,
        from_class_id: student.class_id,
        to_class_id: action === "promote" ? targetClassId : student.class_id,
        action: action,
        academic_year: currentYear,
        promoted_by: user?.id,
      }));

      const { error: historyError } = await supabase
        .from("promotion_history")
        .insert(historyRecords);

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["promotion-history"] });
      toast.success(
        action === "promote"
          ? `${selectedStudents.length} student(s) promoted successfully`
          : `${selectedStudents.length} student(s) marked as retained`
      );
      onSuccess();
      onOpenChange(false);
      setTargetClassId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update students");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote / Retain Students</DialogTitle>
          <DialogDescription>
            {selectedStudents.length} student(s) selected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Action</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={action === "promote" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAction("promote")}
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Promote
              </Button>
              <Button
                type="button"
                variant={action === "retain" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAction("retain")}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retain
              </Button>
            </div>
          </div>

          {action === "promote" && (
            <div className="space-y-2">
              <Label>Promote to Class</Label>
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section || ""} ({cls.academic_year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm font-medium mb-2">Selected Students:</p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedStudentDetails.map((student) => (
                <p key={student.id} className="text-sm text-muted-foreground">
                  {student.admission_number} - {student.first_name} {student.last_name}
                  {student.classes && (
                    <span className="ml-2 text-xs">
                      (Current: {student.classes.name} {student.classes.section || ""})
                    </span>
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => promoteStudents.mutate()}
            disabled={promoteStudents.isPending || (action === "promote" && !targetClassId)}
          >
            {promoteStudents.isPending
              ? "Processing..."
              : action === "promote"
              ? "Promote Students"
              : "Confirm Retain"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

