import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";

export function CollectTuitionFeeDialog() {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: students, isLoading } = useQuery({
    queryKey: ["studentsWithFees", selectedClass, selectedMonth],
    queryFn: async () => {
      if (!selectedClass) return [];

      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          class:classes(name, section),
          fee_assignments!inner(id, amount, status, due_date, fee_category:fee_categories!inner(name))
        `)
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .eq("fee_assignments.fee_category.name", "Tuition Fee")
        .gte("fee_assignments.due_date", `${selectedMonth}-01`)
        .lt("fee_assignments.due_date", `${selectedMonth}-31`)
        .order("first_name");

      if (error) throw error;

      // Initialize paid status
      const status: Record<string, boolean> = {};
      data?.forEach((student: any) => {
        if (student.fee_assignments?.[0]) {
          status[student.fee_assignments[0].id] = student.fee_assignments[0].status === "paid";
        }
      });
      setPaidStatus(status);

      return data;
    },
    enabled: !!selectedClass && !!selectedMonth,
  });

  const updatePayments = useMutation({
    mutationFn: async () => {
      for (const student of students || []) {
        const feeAssignment = student.fee_assignments?.[0];
        if (!feeAssignment) continue;
        
        const isPaid = paidStatus[feeAssignment.id];
        const wasPaid = feeAssignment.status === "paid";
        
        // If marking as paid and wasn't already paid, create payment record
        if (isPaid && !wasPaid) {
          const receiptNumber = `REC-${Date.now()}-${feeAssignment.id}`;
          const { error: paymentError } = await supabase
            .from("payments")
            .insert({
              fee_assignment_id: feeAssignment.id,
              amount: feeAssignment.amount,
              payment_method: "cash",
              receipt_number: receiptNumber,
              payment_date: new Date().toISOString().split('T')[0],
            });
          if (paymentError) throw paymentError;
        }
        
        // Update fee assignment status
        const { error } = await supabase
          .from("fee_assignments")
          .update({ status: isPaid ? "paid" : "pending" })
          .eq("id", feeAssignment.id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate all relevant queries including Dashboard
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["studentsWithFees"] }),
        queryClient.invalidateQueries({ queryKey: ["feeStats"] }),
        queryClient.invalidateQueries({ queryKey: ["students-for-fees"] }),
        queryClient.invalidateQueries({ queryKey: ["allFeeRecords"] }),
        queryClient.invalidateQueries({ queryKey: ["fees-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-fees-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["income-breakdown"] }),
      ]);
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMarkAllPaid = () => {
    const allPaid: Record<string, boolean> = {};
    students?.forEach((student: any) => {
      if (student.fee_assignments?.[0]) {
        allPaid[student.fee_assignments[0].id] = true;
      }
    });
    setPaidStatus(allPaid);
  };

  const handleTogglePaid = (feeId: string, currentStatus: boolean) => {
    setPaidStatus({ ...paidStatus, [feeId]: !currentStatus });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="h-14 px-8 text-base">
          <GraduationCap className="h-5 w-5 mr-2" />
          Collect Tuition Fee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Collect Tuition Fees</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section && `- ${cls.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              />
            </div>
          </div>

          {selectedClass && students && students.length > 0 && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Student Fee List</h3>
                <Button onClick={handleMarkAllPaid} variant="outline">
                  Mark All Paid
                </Button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {students.map((student: any) => {
                  const feeAssignment = student.fee_assignments?.[0];
                  if (!feeAssignment) return null;

                  return (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                            <p>{student.admission_number} • {student.class?.name}</p>
                            {student.parent_name && <p>Parent: {student.parent_name}</p>}
                            {student.parent_phone && <p>Phone: {student.parent_phone}</p>}
                            {student.address && <p className="truncate">Address: {student.address}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <p className="font-semibold text-lg">
                            ₹{Number(feeAssignment.amount).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`fee-${feeAssignment.id}`}
                              checked={paidStatus[feeAssignment.id] || false}
                              onCheckedChange={() =>
                                handleTogglePaid(
                                  feeAssignment.id,
                                  paidStatus[feeAssignment.id]
                                )
                              }
                            />
                            <label
                              htmlFor={`fee-${feeAssignment.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              Paid
                            </label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={() => updatePayments.mutate()}
                  disabled={updatePayments.isPending}
                >
                  {updatePayments.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}

          {selectedClass && students && students.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              No students found with tuition fees for this month
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
