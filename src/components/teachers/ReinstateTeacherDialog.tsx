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
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Props {
  teacher: { id: string; user_id: string | null; first_name: string; last_name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReinstateTeacherDialog({ teacher, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [enableLogin, setEnableLogin] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("employees")
        .update({ status: "active", exit_date: null, exit_reason: null, exit_type: null })
        .eq("id", teacher.id);
      if (error) throw error;

      if (enableLogin && teacher.user_id) {
        await supabase.from("profiles").update({ is_active: true }).eq("id", teacher.user_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      toast({ title: "✓ Reinstated", description: `${teacher.first_name} is active again.` });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reinstate {teacher.first_name} {teacher.last_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Status will be set back to Active. You'll need to reassign classes manually.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center gap-2">
          <Checkbox
            id="re-enable"
            checked={enableLogin}
            onCheckedChange={(v) => setEnableLogin(!!v)}
            disabled={!teacher.user_id}
          />
          <Label htmlFor="re-enable" className="font-normal cursor-pointer">
            Re-enable login account
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Reinstate
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
