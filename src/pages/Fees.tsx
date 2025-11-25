import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search, Eye, DollarSign } from "lucide-react";
import { CollectTuitionFeeDialog } from "@/components/fees/CollectTuitionFeeDialog";
import { CollectBusFeeDialog } from "@/components/fees/CollectBusFeeDialog";
import { SimpleTuitionSetup } from "@/components/fees/SimpleTuitionSetup";
import { SimpleBusSetup } from "@/components/fees/SimpleBusSetup";
import { exportFeesCSV } from "@/lib/fee-csv-export";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function Fees() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedStudentForView, setSelectedStudentForView] = useState<any>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>({});
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");

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

  const { data: students } = useQuery({
    queryKey: ["students-for-fees", selectedClass, searchKeyword],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select(`
          *,
          class:classes(name, section),
          fee_assignments(
            id,
            amount,
            status,
            due_date,
            fee_category:fee_categories(name)
          )
        `)
        .eq("status", "active")
        .order("first_name");

      if (selectedClass) {
        query = query.eq("class_id", selectedClass);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by search keyword on client side for better flexibility
      if (searchKeyword.trim() && data) {
        const keyword = searchKeyword.toLowerCase();
        return data.filter(
          (s: any) =>
            s.first_name?.toLowerCase().includes(keyword) ||
            s.last_name?.toLowerCase().includes(keyword) ||
            s.admission_number?.toLowerCase().includes(keyword) ||
            s.roll_number?.toLowerCase().includes(keyword) ||
            s.father_name?.toLowerCase().includes(keyword) ||
            s.village?.toLowerCase().includes(keyword)
        );
      }
      
      return data;
    },
  });

  const { data: allFeeRecords } = useQuery({
    queryKey: ["allFeeRecords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(
            first_name,
            last_name,
            admission_number,
            village,
            class:classes(name, section)
          ),
          fee_category:fee_categories(name)
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSearch = () => {
    if (!students) {
      setFilteredStudents([]);
      return;
    }

    let filtered = students;

    if (selectedSection) {
      filtered = filtered.filter(
        (s: any) => s.class?.section === selectedSection
      );
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(
        (s: any) =>
          s.first_name?.toLowerCase().includes(keyword) ||
          s.last_name?.toLowerCase().includes(keyword) ||
          s.admission_number?.toLowerCase().includes(keyword) ||
          s.roll_number?.toLowerCase().includes(keyword) ||
          s.father_name?.toLowerCase().includes(keyword)
      );
    }

    setFilteredStudents(filtered);
  };

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ studentId, amount, feeAssignmentId }: { studentId: string, amount: number, feeAssignmentId: string }) => {
      // Insert payment record
      const receiptNumber = `REC-${Date.now()}`;
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          fee_assignment_id: feeAssignmentId,
          amount: amount,
          payment_method: paymentMethod,
          receipt_number: receiptNumber,
          payment_date: new Date().toISOString().split('T')[0],
        });

      if (paymentError) throw paymentError;

      // Update fee assignment status to paid
      const { error: updateError } = await supabase
        .from("fee_assignments")
        .update({ status: "paid" })
        .eq("id", feeAssignmentId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students-for-fees"] });
      queryClient.invalidateQueries({ queryKey: ["allFeeRecords"] });
      queryClient.invalidateQueries({ queryKey: ["student-details"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      setPaymentAmounts({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const collectFeesMutation = useMutation({
    mutationFn: async () => {
      const updates = selectedStudents.map(async (studentId) => {
        const student = filteredStudents.find((s: any) => s.id === studentId);
        if (!student?.fee_assignments?.length) return;

        const pendingFees = student.fee_assignments.filter(
          (f: any) => f.status === "pending"
        );

        for (const fee of pendingFees) {
          const receiptNumber = `REC-${Date.now()}-${fee.id}`;
          
          // Insert payment record
          const { error: paymentError } = await supabase
            .from("payments")
            .insert({
              fee_assignment_id: fee.id,
              amount: fee.amount,
              payment_method: "cash",
              receipt_number: receiptNumber,
              payment_date: new Date().toISOString().split('T')[0],
            });

          if (paymentError) throw paymentError;

          // Update fee assignment status
          const { error } = await supabase
            .from("fee_assignments")
            .update({ status: "paid" })
            .eq("id", fee.id);
          if (error) throw error;
        }
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students-for-fees"] });
      queryClient.invalidateQueries({ queryKey: ["allFeeRecords"] });
      toast({
        title: "Success",
        description: "Fees collected successfully",
      });
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExportCSV = () => {
    if (allFeeRecords && allFeeRecords.length > 0) {
      exportFeesCSV(allFeeRecords);
      toast({
        title: "✓ Export Complete",
        description: `${allFeeRecords.length} fee records downloaded as CSV`,
      });
    } else {
      toast({
        title: "No Records Yet",
        description: "Set up fees first, then you can export them",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map((s: any) => s.id));
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Collection</h1>
          <p className="text-muted-foreground mt-1">
            Search and collect fees from students
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Select Criteria */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Select Criteria</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Class <span className="text-destructive">*</span>
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
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
                {classes
                  ?.find((c: any) => c.id === selectedClass)
                  ?.section ? (
                  <SelectItem
                    value={
                      classes?.find((c: any) => c.id === selectedClass)?.section
                    }
                  >
                    {classes?.find((c: any) => c.id === selectedClass)?.section}
                  </SelectItem>
                ) : (
                  <SelectItem value="none" disabled>
                    No section
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Search By Keyword</label>
            <Input
              placeholder="Search By Student Name, Roll Number, Enroll Number, National Id, Local Id Etc."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
          {selectedStudents.length > 0 && (
            <Button
              onClick={() => collectFeesMutation.mutate()}
              disabled={collectFeesMutation.isPending}
              variant="default"
            >
              {collectFeesMutation.isPending
                ? "Collecting..."
                : `Collect Fees (${selectedStudents.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="bg-card border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Student List</h2>

        {filteredStudents.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedStudents.length === filteredStudents.length &&
                        filteredStudents.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Father Name</TableHead>
                  <TableHead>Date Of Birth</TableHead>
                  <TableHead>Mobile No.</TableHead>
                  <TableHead>Pending Fees</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: any) => {
                  const pendingFees = student.fee_assignments?.filter(
                    (f: any) => f.status === "pending"
                  );
                  const totalPending = pendingFees?.reduce(
                    (sum: number, f: any) => sum + (f.amount || 0),
                    0
                  );

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([
                                ...selectedStudents,
                                student.id,
                              ]);
                            } else {
                              setSelectedStudents(
                                selectedStudents.filter((id) => id !== student.id)
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>{student.class?.name}</TableCell>
                      <TableCell>{student.class?.section || "-"}</TableCell>
                      <TableCell>{student.admission_number}</TableCell>
                      <TableCell>
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.father_name || "-"}</TableCell>
                      <TableCell>
                        {student.date_of_birth
                          ? new Date(student.date_of_birth).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{student.parent_phone || "-"}</TableCell>
                      <TableCell>
                        {totalPending > 0 ? (
                          <span className="font-semibold text-destructive">
                            ₹{totalPending.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudentForView(student);
                            setShowStudentDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            <div className="px-4 py-3 border-t bg-muted/50 text-sm text-muted-foreground">
              Records: {filteredStudents.length} of {students?.length || 0}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <svg
              className="w-24 h-24 mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">No data available in table</p>
            <p className="text-sm mt-1">
              ← Add new record or search with different criteria.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex gap-3">
          <CollectTuitionFeeDialog />
          <CollectBusFeeDialog />
        </div>
      </div>

      {/* Setup Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <SimpleTuitionSetup />
        <SimpleBusSetup />
      </div>

      {/* Student Fee Details Dialog */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Fee Details</DialogTitle>
          </DialogHeader>
          
          {selectedStudentForView && (
            <div className="space-y-6">
              {/* Student Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Student Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {selectedStudentForView.first_name} {selectedStudentForView.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admission No.</p>
                    <p className="font-medium">{selectedStudentForView.admission_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">
                      {selectedStudentForView.class?.name} {selectedStudentForView.class?.section || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Father Name</p>
                    <p className="font-medium">{selectedStudentForView.father_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{selectedStudentForView.parent_phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Village</p>
                    <p className="font-medium">{selectedStudentForView.village || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Fee Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Assigned</p>
                      <p className="text-2xl font-bold">
                        ₹{selectedStudentForView.fee_assignments
                          ?.reduce((sum: number, f: any) => sum + (f.amount || 0), 0)
                          .toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{selectedStudentForView.fee_assignments
                          ?.filter((f: any) => f.status === "paid")
                          ?.reduce((sum: number, f: any) => sum + (f.amount || 0), 0)
                          .toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold text-destructive">
                        ₹{selectedStudentForView.fee_assignments
                          ?.filter((f: any) => f.status === "pending")
                          ?.reduce((sum: number, f: any) => sum + (f.amount || 0), 0)
                          .toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Details */}
              <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pending">Pending Fees</TabsTrigger>
                  <TabsTrigger value="paid">Payment History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending">
                  <Card>
                    <CardContent className="pt-6">
                      {selectedStudentForView.fee_assignments?.filter((f: any) => f.status === "pending").length > 0 ? (
                        <div className="space-y-3">
                          {selectedStudentForView.fee_assignments
                            ?.filter((f: any) => f.status === "pending")
                            .map((fee: any) => (
                              <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                                <div className="flex-1">
                                  <p className="font-medium">{fee.fee_category?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Due: {new Date(fee.due_date).toLocaleDateString()}
                                  </p>
                                  <p className="text-lg font-bold mt-1">Total: ₹{fee.amount}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs text-muted-foreground">Amount</label>
                                    <Input
                                      type="number"
                                      placeholder="Enter amount"
                                      value={paymentAmounts[fee.id] || ""}
                                      onChange={(e) => 
                                        setPaymentAmounts({
                                          ...paymentAmounts,
                                          [fee.id]: e.target.value
                                        })
                                      }
                                      className="w-32"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const amount = parseFloat(paymentAmounts[fee.id] || fee.amount.toString());
                                      if (!amount || amount <= 0) {
                                        toast({
                                          title: "Invalid Amount",
                                          description: "Please enter a valid payment amount",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      if (amount > fee.amount) {
                                        toast({
                                          title: "Amount Too High",
                                          description: "Payment amount cannot exceed due amount",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      recordPaymentMutation.mutate({
                                        studentId: selectedStudentForView.id,
                                        amount: amount,
                                        feeAssignmentId: fee.id,
                                      });
                                    }}
                                    disabled={recordPaymentMutation.isPending}
                                  >
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Pay
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No pending fees</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="paid">
                  <Card>
                    <CardContent className="pt-6">
                      {selectedStudentForView.fee_assignments?.filter((f: any) => f.status === "paid").length > 0 ? (
                        <div className="space-y-3">
                          {selectedStudentForView.fee_assignments
                            ?.filter((f: any) => f.status === "paid")
                            .map((fee: any) => (
                              <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                  <p className="font-medium">{fee.fee_category?.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Paid on: {new Date(fee.due_date).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Paid
                                  </Badge>
                                  <p className="text-lg font-bold">₹{fee.amount}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No payment history</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
