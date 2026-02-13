import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Printer, DollarSign, Plus } from "lucide-react";
import { FeeReceipt } from "@/components/fees/FeeReceipt";

interface StudentFeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  paymentAmounts: Record<string, string>;
  setPaymentAmounts: (v: Record<string, string>) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  recordPaymentMutation: any;
  toast: any;
}

export function StudentFeesDialog({
  open,
  onOpenChange,
  student,
  paymentAmounts,
  setPaymentAmounts,
  paymentMethod,
  setPaymentMethod,
  recordPaymentMutation,
  toast,
}: StudentFeesDialogProps) {
  const [selectedFees, setSelectedFees] = useState<string[]>([]);

  // Fetch payments for this student's fee assignments
  const feeIds = student?.fee_assignments?.map((f: any) => f.id) || [];
  const { data: payments } = useQuery({
    queryKey: ["student-payments", student?.id],
    queryFn: async () => {
      if (!feeIds.length) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .in("fee_assignment_id", feeIds)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!student?.id && feeIds.length > 0,
  });

  if (!student) return null;

  const feeAssignments = student.fee_assignments || [];
  const today = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const getPaymentsForFee = (feeId: string) =>
    payments?.filter((p: any) => p.fee_assignment_id === feeId) || [];

  const getStatusBadge = (status: string, amount: number, feeId: string) => {
    const paidPayments = getPaymentsForFee(feeId);
    const totalPaid = paidPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    if (status === "paid" || totalPaid >= amount) {
      return <Badge className="bg-green-500 text-white hover:bg-green-600">Paid</Badge>;
    }
    if (totalPaid > 0 && totalPaid < amount) {
      return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Partial</Badge>;
    }
    return <Badge className="bg-red-500 text-white hover:bg-red-600">Unpaid</Badge>;
  };

  const toggleFee = (feeId: string) => {
    setSelectedFees((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    );
  };

  const toggleAll = () => {
    const pendingIds = feeAssignments
      .filter((f: any) => f.status === "pending")
      .map((f: any) => f.id);
    setSelectedFees((prev) =>
      prev.length === pendingIds.length ? [] : pendingIds
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl">Student Fees</DialogTitle>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </DialogHeader>

        {/* Student Info Card */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium text-muted-foreground w-1/6">Name</td>
                <td className="p-3 w-1/3">{student.first_name} {student.last_name}</td>
                <td className="p-3 font-medium text-muted-foreground w-1/6">Class (Section)</td>
                <td className="p-3 w-1/3">{student.class?.name} ({student.class?.section || "-"})</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium text-muted-foreground">Father Name</td>
                <td className="p-3">{student.father_name || "-"}</td>
                <td className="p-3 font-medium text-muted-foreground">Admission No</td>
                <td className="p-3">{student.admission_number}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium text-muted-foreground">Mobile Number</td>
                <td className="p-3">{student.parent_phone || "-"}</td>
                <td className="p-3 font-medium text-muted-foreground">Roll Number</td>
                <td className="p-3">{student.roll_number || "-"}</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Category</td>
                <td className="p-3">{student.category || "-"}</td>
                <td className="p-3 font-medium text-muted-foreground">Village</td>
                <td className="p-3">{student.village || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons & Date */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" disabled>
              <Printer className="h-4 w-4" /> Print Selected
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={selectedFees.length === 0 || recordPaymentMutation.isPending}
              onClick={() => {
                selectedFees.forEach((feeId) => {
                  const fee = feeAssignments.find((f: any) => f.id === feeId);
                  if (fee && fee.status === "pending") {
                    const amount = parseFloat(paymentAmounts[feeId] || fee.amount.toString());
                    recordPaymentMutation.mutate({
                      studentId: student.id,
                      amount,
                      feeAssignmentId: feeId,
                    });
                  }
                });
                setSelectedFees([]);
              }}
            >
              <DollarSign className="h-4 w-4" /> Collect Selected
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Date: {today}</p>
        </div>

        {/* Fees Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selectedFees.length > 0 &&
                      selectedFees.length ===
                        feeAssignments.filter((f: any) => f.status === "pending").length
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Fees</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Discount (₹)</TableHead>
                <TableHead className="text-right">Fine (₹)</TableHead>
                <TableHead className="text-right">Paid (₹)</TableHead>
                <TableHead className="text-right">Balance (₹)</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeAssignments.map((fee: any) => {
                const feePayments = getPaymentsForFee(fee.id);
                const totalPaid = feePayments.reduce(
                  (s: number, p: any) => s + Number(p.amount),
                  0
                );
                const balance = Number(fee.amount) - totalPaid;
                const isPending = fee.status === "pending" && balance > 0;

                return (
                  <>
                    {/* Fee Row */}
                    <TableRow key={fee.id} className={isPending ? "bg-orange-50/50" : ""}>
                      <TableCell>
                        {isPending && (
                          <Checkbox
                            checked={selectedFees.includes(fee.id)}
                            onCheckedChange={() => toggleFee(fee.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {fee.fee_category?.name || "Fee"}
                      </TableCell>
                      <TableCell>
                        {new Date(fee.due_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(fee.status, Number(fee.amount), fee.id)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(fee.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">0.00</TableCell>
                      <TableCell className="text-right">0.00</TableCell>
                      <TableCell className="text-right">
                        {totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {balance > 0
                          ? balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                          : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isPending && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                const amount = parseFloat(
                                  paymentAmounts[fee.id] || balance.toString()
                                );
                                if (!amount || amount <= 0) {
                                  toast({
                                    title: "Invalid Amount",
                                    description: "Enter a valid payment amount",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                recordPaymentMutation.mutate({
                                  studentId: student.id,
                                  amount,
                                  feeAssignmentId: fee.id,
                                });
                              }}
                              disabled={recordPaymentMutation.isPending}
                              title="Collect Fee"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {totalPaid > 0 && feePayments.length > 0 && (
                            <FeeReceipt
                              student={student}
                              payment={feePayments[0]}
                              feeName={fee.fee_category?.name || "Fee"}
                              totalAmount={Number(fee.amount)}
                              balance={balance}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Payment sub-rows */}
                    {feePayments.map((payment: any) => (
                      <TableRow key={payment.id} className="bg-muted/30 text-sm">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.receipt_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground capitalize">
                          {payment.payment_method}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right text-primary">0.00</TableCell>
                        <TableCell className="text-right">0.00</TableCell>
                        <TableCell className="text-right">
                          {Number(payment.amount).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <FeeReceipt
                            student={student}
                            payment={payment}
                            feeName={feeAssignments.find((f: any) => f.id === payment.fee_assignment_id)?.fee_category?.name || "Fee"}
                            totalAmount={Number(feeAssignments.find((f: any) => f.id === payment.fee_assignment_id)?.amount || 0)}
                            balance={0}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                );
              })}

              {feeAssignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    No fees assigned to this student
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
