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
import { Bus } from "lucide-react";
import { Card } from "@/components/ui/card";

export function CollectBusFeeDialog() {
  const [open, setOpen] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: villages } = useQuery({
    queryKey: ["villages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_routes")
        .select("village")
        .not("village", "is", null)
        .order("village");
      if (error) throw error;
      // Get unique villages
      const uniqueVillages = [...new Set(data.map((r: any) => r.village))];
      return uniqueVillages;
    },
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["studentsWithBusFees", selectedVillage, selectedMonth],
    queryFn: async () => {
      if (!selectedVillage) return [];

      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          class:classes(name, section),
          fee_assignments!inner(id, amount, status, due_date, fee_category:fee_categories!inner(name))
        `)
        .eq("village", selectedVillage)
        .eq("status", "active")
        .eq("fee_assignments.fee_category.name", "Bus Fee")
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
    enabled: !!selectedVillage && !!selectedMonth,
  });

  const updatePayments = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(paidStatus).map(([id, isPaid]) => ({
        id,
        status: isPaid ? "paid" : "pending",
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("fee_assignments")
          .update({ status: update.status })
          .eq("id", update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studentsWithBusFees"] });
      queryClient.invalidateQueries({ queryKey: ["feeStats"] });
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
          <Bus className="h-5 w-5 mr-2" />
          Collect Bus Fee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Collect Bus Fees</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Village</label>
              <Select value={selectedVillage} onValueChange={setSelectedVillage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a village" />
                </SelectTrigger>
                <SelectContent>
                  {villages?.map((village: any) => (
                    <SelectItem key={village} value={village}>
                      {village}
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

          {selectedVillage && students && students.length > 0 && (
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
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.admission_number} • {student.class?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
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

          {selectedVillage && students && students.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
              No students found with bus fees for this village/month
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
