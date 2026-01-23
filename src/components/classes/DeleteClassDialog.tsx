import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface DeleteClassDialogProps {
  classId: string;
  className: string;
  section?: string | null;
  children: React.ReactNode;
}

export function DeleteClassDialog({
  classId,
  className,
  section,
  children,
}: DeleteClassDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteClass = useMutation({
    mutationFn: async () => {
      // First check if there are students in this class
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("class_id", classId)
        .limit(1);

      if (students && students.length > 0) {
        throw new Error("Cannot delete class with students. Please reassign or remove students first.");
      }

      // Delete class subjects first
      await supabase.from("class_subjects").delete().eq("class_id", classId);
      
      // Delete class fee structure
      await supabase.from("class_fee_structure").delete().eq("class_id", classId);

      // Delete the class
      const { error } = await supabase.from("classes").delete().eq("id", classId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted successfully");
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete class");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Class</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold">
              {className}
              {section && ` - ${section}`}
            </span>
            ? This action cannot be undone. All associated subjects and fee structures will also be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteClass.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteClass.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
