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
  DialogTrigger,
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
import { ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BatchPromoteDialogProps {
  children: React.ReactNode;
}

export function BatchPromoteDialog({ children }: BatchPromoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceClassId, setSourceClassId] = useState<string>("");
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

  const { data: sourceStudents } = useQuery({
    queryKey: ["students-by-class", sourceClassId],
    queryFn: async () => {
      if (!sourceClassId) return [];
      const { data, error } = await supabase
        .from("students")
        .select("id, admission_number, first_name, last_name")
        .eq("class_id", sourceClassId)
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: !!sourceClassId,
  });

  const sourceClass = classes?.find((c) => c.id === sourceClassId);
  const targetClass = classes?.find((c) => c.id === targetClassId);

  const batchPromote = useMutation({
    mutationFn: async () => {
      if (!sourceClassId || !targetClassId) {
        throw new Error("Please select both source and target classes");
      }

      if (sourceClassId === targetClassId) {
        throw new Error("Source and target classes must be different");
      }

      if (!sourceStudents?.length) {
        throw new Error("No active students in the source class");
      }

      const studentIds = sourceStudents.map((s) => s.id);

      const { error } = await supabase
        .from("students")
        .update({ class_id: targetClassId })
        .in("id", studentIds);

      if (error) throw error;

      return studentIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-by-class"] });
      toast.success(
        `${count} student(s) promoted from ${sourceClass?.name} ${sourceClass?.section || ""} to ${targetClass?.name} ${targetClass?.section || ""}`
      );
      setOpen(false);
      setSourceClassId("");
      setTargetClassId("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to promote students");
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSourceClassId("");
      setTargetClassId("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Batch Class Promotion</DialogTitle>
          <DialogDescription>
            Promote all active students from one class to another automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>From Class (Source)</Label>
            <Select value={sourceClassId} onValueChange={setSourceClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source class" />
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

          {sourceClassId && (
            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <div className="space-y-2">
            <Label>To Class (Target)</Label>
            <Select 
              value={targetClassId} 
              onValueChange={setTargetClassId}
              disabled={!sourceClassId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target class" />
              </SelectTrigger>
              <SelectContent>
                {classes
                  ?.filter((cls) => cls.id !== sourceClassId)
                  .map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section || ""} ({cls.academic_year})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {sourceClassId && sourceStudents && (
            <div className="rounded-md border bg-muted/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Students to Promote</span>
                </div>
                <Badge variant="secondary">{sourceStudents.length} students</Badge>
              </div>
              
              {sourceStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No active students in this class
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {sourceStudents.map((student) => (
                    <p key={student.id} className="text-sm text-muted-foreground">
                      {student.admission_number} - {student.first_name} {student.last_name}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {sourceClassId && targetClassId && sourceStudents && sourceStudents.length > 0 && (
            <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
              <p className="text-sm text-center">
                <strong>{sourceStudents.length}</strong> student(s) will be promoted from{" "}
                <strong>{sourceClass?.name} {sourceClass?.section || ""}</strong> to{" "}
                <strong>{targetClass?.name} {targetClass?.section || ""}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => batchPromote.mutate()}
            disabled={
              batchPromote.isPending ||
              !sourceClassId ||
              !targetClassId ||
              !sourceStudents?.length
            }
          >
            {batchPromote.isPending ? "Promoting..." : "Promote All Students"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
