import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserX, UserCheck, Pencil, Clock } from "lucide-react";

interface Props {
  teacher: { id: string; first_name: string; last_name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_META: Record<string, { label: string; icon: any; tone: string }> = {
  teacher_exit: { label: "Exited", icon: UserX, tone: "text-destructive" },
  teacher_reinstate: { label: "Reinstated", icon: UserCheck, tone: "text-green-600" },
  teacher_update: { label: "Updated", icon: Pencil, tone: "text-blue-600" },
};

export function TeacherAuditTimelineDialog({ teacher, open, onOpenChange }: Props) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["teacher-audit", teacher.id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("resource_type", "employee")
        .eq("resource_id", teacher.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Audit Timeline — {teacher.first_name} {teacher.last_name}</DialogTitle>
          <DialogDescription>
            All changes recorded for this teacher's record.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading history...</p>
          ) : !logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No history yet.</p>
          ) : (
            <ol className="relative border-l border-border ml-3 space-y-5">
              {logs.map((log) => {
                const meta = ACTION_META[log.action] || { label: log.action, icon: Clock, tone: "text-muted-foreground" };
                const Icon = meta.icon;
                const details: any = log.details || {};
                const changed = details.changed_fields as Record<string, { from: any; to: any }> | undefined;
                return (
                  <li key={log.id} className="ml-5">
                    <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border ${meta.tone}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at!).toLocaleString()}
                      </span>
                    </div>
                    {details.exit_type && (
                      <p className="text-sm mt-1">
                        Type: <span className="font-medium">{details.exit_type}</span>
                        {details.exit_date && <> · Last working: {details.exit_date}</>}
                      </p>
                    )}
                    {details.reason && (
                      <p className="text-sm text-muted-foreground mt-1">"{details.reason}"</p>
                    )}
                    {details.unassigned_classes !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {details.unassigned_classes ? "Unassigned from classes. " : ""}
                        {details.login_disabled ? "Login disabled." : ""}
                        {details.login_enabled ? "Login re-enabled." : ""}
                      </p>
                    )}
                    {changed && Object.keys(changed).length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs">
                        {Object.entries(changed).map(([field, v]) => (
                          <li key={field} className="bg-muted/40 rounded px-2 py-1">
                            <span className="font-medium">{field}:</span>{" "}
                            <span className="line-through text-muted-foreground">{String(v.from ?? "—")}</span>
                            {" → "}
                            <span>{String(v.to ?? "—")}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
