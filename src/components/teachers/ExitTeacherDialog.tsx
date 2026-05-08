import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
  teacher: {
    id: string;
    user_id: string | null;
    first_name: string;
    last_name: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXIT_TYPES = [
  { value: "resigned", label: "Resigned" },
  { value: "dismissed", label: "Dismissed" },
  { value: "terminated", label: "Terminated" },
  { value: "retired", label: "Retired" },
  { value: "on_leave", label: "On Long Leave" },
];

export function ExitTeacherDialog({ teacher, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [exitType, setExitType] = useState("resigned");
  const [exitDate, setExitDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [disableLogin, setDisableLogin] = useState(true);
  const [unassign, setUnassign] = useState(true);

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Update employee
      const { error: empErr } = await supabase
        .from("employees")
        .update({
          status: exitType,
          exit_type: exitType,
          exit_date: exitDate,
          exit_reason: reason || null,
        })
        .eq("id", teacher.id);
      if (empErr) throw empErr;

      // 2. Unassign from class_subjects
      if (unassign) {
        const { error: csErr } = await supabase
          .from("class_subjects")
          .update({ teacher_id: null })
          .eq("teacher_id", teacher.id);
        if (csErr) throw csErr;
      }

      // 3. Disable login
      if (disableLogin && teacher.user_id) {
        const { error: profErr } = await supabase
          .from("profiles")
          .update({ is_active: false })
          .eq("id", teacher.user_id);
        if (profErr) throw profErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast({
        title: "✓ Teacher exited",
        description: `${teacher.first_name}'s record is preserved. History remains intact.`,
      });
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exit Teacher — {teacher.first_name} {teacher.last_name}</DialogTitle>
          <DialogDescription>
            Records, marks, and attendance history are preserved. The teacher just stops being active.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Exit type</Label>
            <Select value={exitType} onValueChange={setExitType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXIT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Last working date</Label>
            <Input type="date" value={exitDate} onChange={(e) => setExitDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Reason / notes (optional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Checkbox id="unassign" checked={unassign} onCheckedChange={(v) => setUnassign(!!v)} />
              <Label htmlFor="unassign" className="font-normal cursor-pointer">
                Unassign from all classes & subjects
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="disable"
                checked={disableLogin}
                onCheckedChange={(v) => setDisableLogin(!!v)}
                disabled={!teacher.user_id}
              />
              <Label htmlFor="disable" className="font-normal cursor-pointer">
                Disable login account
                {!teacher.user_id && <span className="text-xs text-muted-foreground ml-2">(no login linked)</span>}
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Processing..." : "Confirm Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
