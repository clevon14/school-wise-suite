import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, DollarSign } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function StudentTransportFees() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searched, setSearched] = useState(false);
  const [collectStudent, setCollectStudent] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
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
    queryKey: ["transport-fee-students", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          class:classes(name, section),
          student_transport(
            id,
            status,
            route:bus_routes(
              route_name,
              route_number,
              monthly_fee,
              village,
              bus:buses(bus_number, vehicle_number)
            ),
            stop:bus_stops(stop_name)
          )
        `)
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
  });

  // Fetch bus fee assignments for the selected student
  const { data: busFeeAssignments } = useQuery({
    queryKey: ["bus-fee-assignments", collectStudent?.id],
    queryFn: async () => {
      if (!collectStudent) return [];
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          fee_category:fee_categories(name),
          payments:payments(id, amount, payment_date, payment_method, receipt_number)
        `)
        .eq("student_id", collectStudent.id)
        .order("due_date", { ascending: false });
      if (error) throw error;
      // Filter to bus-related fees
      return data?.filter((fa: any) => 
        fa.fee_category?.name?.toLowerCase().includes("bus")
      ) || [];
    },
    enabled: !!collectStudent?.id,
  });

  const collectMutation = useMutation({
    mutationFn: async ({ feeAssignmentId, amount }: { feeAssignmentId: string; amount: number }) => {
      const receiptNumber = `BUS-REC-${Date.now()}`;
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          fee_assignment_id: feeAssignmentId,
          amount,
          payment_method: paymentMethod,
          receipt_number: receiptNumber,
          payment_date: new Date().toISOString().split("T")[0],
        });
      if (paymentError) throw paymentError;

      const { error: updateError } = await supabase
        .from("fee_assignments")
        .update({ status: "paid" })
        .eq("id", feeAssignmentId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-fee-assignments", collectStudent?.id] });
      queryClient.invalidateQueries({ queryKey: ["transport-fee-students"] });
      queryClient.invalidateQueries({ queryKey: ["fees-summary"] });
      toast({ title: "Success", description: "Bus fee collected successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSearch = () => {
    setSearched(true);
  };

  const filteredStudents = students?.filter((s: any) => {
    if (!searched && !selectedClass) return false;
    const matchesSection = !selectedSection || s.class?.section === selectedSection;
    const keyword = searchKeyword.toLowerCase();
    const matchesKeyword =
      !searchKeyword.trim() ||
      s.first_name?.toLowerCase().includes(keyword) ||
      s.last_name?.toLowerCase().includes(keyword) ||
      s.admission_number?.toLowerCase().includes(keyword) ||
      s.father_name?.toLowerCase().includes(keyword);
    return matchesSection && matchesKeyword;
  }) || [];

  const selectedClassData = classes?.find((c: any) => c.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Select Criteria */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Select Criteria</h2>
        <div className="border-t pt-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Class <span className="text-destructive">*</span>
            </label>
            <Select
              value={selectedClass}
              onValueChange={(val) => {
                setSelectedClass(val);
                setSelectedSection("");
                setSearched(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Section</label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {selectedClassData?.section ? (
                  <SelectItem value={selectedClassData.section}>
                    {selectedClassData.section}
                  </SelectItem>
                ) : (
                  <SelectItem value="none" disabled>
                    No section
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      {/* Student Transport Fees Table */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Student Transport Fees</h2>
        <div className="border-t pt-4" />

        <div className="flex items-center gap-4">
          <Input
            placeholder="Search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">Loading...</p>
        ) : selectedClass && filteredStudents.length > 0 ? (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Father Name</TableHead>
                    <TableHead>Date Of Birth</TableHead>
                    <TableHead>Route Title</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Pickup Point</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: any) => {
                    const activeTransport = student.student_transport?.find(
                      (t: any) => t.status === "active"
                    );
                    const route = activeTransport?.route;
                    const bus = route?.bus;
                    const stop = activeTransport?.stop;

                    return (
                      <TableRow key={student.id}>
                        <TableCell>{student.admission_number}</TableCell>
                        <TableCell>
                          <span className="text-primary font-medium">
                            {student.first_name} {student.last_name}
                          </span>
                        </TableCell>
                        <TableCell>
                          {student.class?.name}
                          {student.class?.section ? `(${student.class.section})` : ""}
                        </TableCell>
                        <TableCell>{student.father_name || "-"}</TableCell>
                        <TableCell>
                          {student.date_of_birth
                            ? new Date(student.date_of_birth).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{route?.route_name || "-"}</TableCell>
                        <TableCell>{bus?.vehicle_number || "-"}</TableCell>
                        <TableCell>{stop?.stop_name || route?.village || "-"}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-8 w-8 rounded-full"
                            title="Collect Bus Fee"
                            onClick={() => setCollectStudent(student)}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing 1 to {filteredStudents.length} of {filteredStudents.length} entries
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No data available in table</p>
            <p className="text-sm mt-1">
              {!selectedClass
                ? "Select a class and click Search to view students."
                : "No students found with the current criteria."}
            </p>
          </div>
        )}
      </div>

      {/* Collect Bus Fee Dialog */}
      <Dialog open={!!collectStudent} onOpenChange={(open) => !open && setCollectStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Collect Bus Fee</DialogTitle>
          </DialogHeader>

          {collectStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground">Student:</span>{" "}
                  <span className="font-medium">{collectStudent.first_name} {collectStudent.last_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Admission No:</span>{" "}
                  <span className="font-medium">{collectStudent.admission_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Class:</span>{" "}
                  <span className="font-medium">
                    {collectStudent.class?.name}{collectStudent.class?.section ? ` (${collectStudent.class.section})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Father:</span>{" "}
                  <span className="font-medium">{collectStudent.father_name || "-"}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Table */}
              {busFeeAssignments && busFeeAssignments.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {busFeeAssignments.map((fa: any) => {
                        const totalPaid = fa.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
                        const balance = Number(fa.amount) - totalPaid;
                        const isPaid = balance <= 0;

                        return (
                          <TableRow key={fa.id}>
                            <TableCell className="font-medium">{fa.fee_category?.name}</TableCell>
                            <TableCell>{new Date(fa.due_date).toLocaleDateString()}</TableCell>
                            <TableCell>₹{Number(fa.amount).toLocaleString()}</TableCell>
                            <TableCell>₹{totalPaid.toLocaleString()}</TableCell>
                            <TableCell className={balance > 0 ? "text-destructive font-medium" : ""}>
                              ₹{balance.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={isPaid ? "default" : balance > 0 && totalPaid > 0 ? "secondary" : "destructive"}>
                                {isPaid ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  onClick={() => collectMutation.mutate({ feeAssignmentId: fa.id, amount: balance })}
                                  disabled={collectMutation.isPending}
                                >
                                  {collectMutation.isPending ? "..." : "Collect"}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No bus fee assignments found for this student.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
