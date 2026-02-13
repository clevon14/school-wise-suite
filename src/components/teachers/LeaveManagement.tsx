import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check, X } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

const LEAVE_TYPES = ["casual", "medical", "sick", "maternity"];

export function LeaveManagement() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [leaveType, setLeaveType] = useState("casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: employees } = useQuery({
    queryKey: ["employees-for-leave"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, casual_leave, medical_leave, sick_leave, maternity_leave")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: leaveRequests, isLoading } = useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, employee:employees(first_name, last_name, department)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("leave_requests").insert({
        employee_id: selectedEmployee,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate || startDate,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      setAddOpen(false);
      setSelectedEmployee("");
      setStartDate("");
      setEndDate("");
      setReason("");
      toast.success("Leave request created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, employeeId, leaveType: lt, days }: { id: string; status: string; employeeId: string; leaveType: string; days: number }) => {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;

      // Deduct leave balance on approval
      if (status === "approved") {
        const field = `${lt}_leave` as "casual_leave" | "medical_leave" | "sick_leave" | "maternity_leave";
        const emp = employees?.find((e) => e.id === employeeId);
        if (emp) {
          const currentBalance = (emp as any)[field] || 0;
          const newBalance = Math.max(0, currentBalance - days);
          const { error: updateErr } = await supabase
            .from("employees")
            .update({ [field]: newBalance })
            .eq("id", employeeId);
          if (updateErr) throw updateErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-leave"] });
      toast.success("Leave request updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getStatusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-success text-success-foreground">Approved</Badge>;
    if (status === "rejected") return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leave Management</CardTitle>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Apply Leave</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Employee *</label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Leave Type</label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedEmployee && (
                <div className="p-3 border rounded-lg bg-muted/50 text-sm">
                  <p className="font-medium mb-1">Leave Balance:</p>
                  {(() => {
                    const emp = employees?.find((e) => e.id === selectedEmployee);
                    if (!emp) return null;
                    return (
                      <div className="grid grid-cols-2 gap-1">
                        <span>Casual: {emp.casual_leave || 0}</span>
                        <span>Medical: {emp.medical_leave || 0}</span>
                        <span>Sick: {emp.sick_leave || 0}</span>
                        <span>Maternity: {emp.maternity_leave || 0}</span>
                      </div>
                    );
                  })()}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date *</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave..." />
              </div>
              <Button
                className="w-full"
                onClick={() => createLeaveMutation.mutate()}
                disabled={!selectedEmployee || !startDate || createLeaveMutation.isPending}
              >
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : leaveRequests && leaveRequests.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((req: any) => {
                  const days = differenceInDays(new Date(req.end_date), new Date(req.start_date)) + 1;
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.employee?.first_name} {req.employee?.last_name}
                        {req.employee?.department && <p className="text-xs text-muted-foreground">{req.employee.department}</p>}
                      </TableCell>
                      <TableCell className="capitalize">{req.leave_type}</TableCell>
                      <TableCell>{format(new Date(req.start_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{format(new Date(req.end_date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{days}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{req.reason || "-"}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        {req.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-success"
                              onClick={() => updateStatusMutation.mutate({
                                id: req.id,
                                status: "approved",
                                employeeId: req.employee_id,
                                leaveType: req.leave_type,
                                days,
                              })}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => updateStatusMutation.mutate({
                                id: req.id,
                                status: "rejected",
                                employeeId: req.employee_id,
                                leaveType: req.leave_type,
                                days,
                              })}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No leave requests yet</p>
        )}
      </CardContent>
    </Card>
  );
}
