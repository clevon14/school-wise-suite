import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowRight, History, RotateCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromotionHistoryDialogProps {
  children: React.ReactNode;
}

export function PromotionHistoryDialog({ children }: PromotionHistoryDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: history, isLoading } = useQuery({
    queryKey: ["promotion-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_history")
        .select(`
          *,
          student:students(admission_number, first_name, last_name),
          from_class:classes!promotion_history_from_class_id_fkey(name, section),
          to_class:classes!promotion_history_to_class_id_fkey(name, section)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Promotion History
          </DialogTitle>
          <DialogDescription>
            View all student promotions and retentions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading history...</p>
          ) : !history?.length ? (
            <p className="text-center py-8 text-muted-foreground">No promotion history found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>From Class</TableHead>
                  <TableHead>To Class</TableHead>
                  <TableHead>Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record: any) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(record.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {record.student ? (
                        <span>
                          {record.student.admission_number} - {record.student.first_name} {record.student.last_name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Deleted student</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.action === "promote" ? "default" : "secondary"}>
                        {record.action === "promote" ? (
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            Promoted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" />
                            Retained
                          </span>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.from_class ? (
                        `${record.from_class.name} ${record.from_class.section || ""}`
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.to_class ? (
                        `${record.to_class.name} ${record.to_class.section || ""}`
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{record.academic_year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
