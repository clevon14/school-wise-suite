import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search, Eye, DollarSign, CreditCard, Receipt, AlertCircle, Settings, Tag, Percent, ArrowRightLeft, Bell } from "lucide-react";
import { StudentFeesDialog } from "@/components/fees/StudentFeesDialog";
import { SimpleTuitionSetup } from "@/components/fees/SimpleTuitionSetup";

import { SearchFeesPayment } from "@/components/fees/SearchFeesPayment";
import { SearchDueFees } from "@/components/fees/SearchDueFees";
import { FeesMaster } from "@/components/fees/FeesMaster";
import { FeesDiscount } from "@/components/fees/FeesDiscount";
import { FeesReminder } from "@/components/fees/FeesReminder";
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
  const [activeTab, setActiveTab] = useState("collect");
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

      const { error: updateError } = await supabase
        .from("fee_assignments")
        .update({ status: "paid" })
        .eq("id", feeAssignmentId);

      if (updateError) throw updateError;

      return studentId;
    },
    onSuccess: async (studentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students-for-fees"] }),
        queryClient.invalidateQueries({ queryKey: ["allFeeRecords"] }),
        queryClient.invalidateQueries({ queryKey: ["fees-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-fees-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["income-breakdown"] }),
      ]);
      
      const { data } = await supabase
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
        .eq("id", studentId)
        .single();
      
      if (data) {
        setSelectedStudentForView(data);
      }
      
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

          const { error } = await supabase
            .from("fee_assignments")
            .update({ status: "paid" })
            .eq("id", fee.id);
          if (error) throw error;
        }
      });

      await Promise.all(updates);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["students-for-fees"] }),
        queryClient.invalidateQueries({ queryKey: ["allFeeRecords"] }),
        queryClient.invalidateQueries({ queryKey: ["fees-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-fees-chart"] }),
        queryClient.invalidateQueries({ queryKey: ["income-breakdown"] }),
      ]);
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

  const tabItems = [
    { value: "collect", label: "Collect Fees", icon: CreditCard },
    { value: "search-payment", label: "Search Fees Payment", icon: Receipt },
    { value: "search-due", label: "Search Due Fees", icon: AlertCircle },
    { value: "fees-master", label: "Fees Master", icon: Settings },
    { value: "fees-setup", label: "Fees Setup", icon: Tag },
    { value: "fees-discount", label: "Fees Discount", icon: Percent },
    { value: "fees-reminder", label: "Fees Reminder", icon: Bell },
  ];

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees Collection</h1>
          <p className="text-muted-foreground mt-1">
            Manage all fee-related operations
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 text-sm px-4 py-2"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Collect Fees Tab */}
        <TabsContent value="collect" className="space-y-6 mt-6">
          {/* Select Criteria */}
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Select Criteria</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Class <span className="text-destructive">*</span>
                </label>
                <Select value={selectedClass} onValueChange={(val) => { setSelectedClass(val); setSearchKeyword(""); }}>
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
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          {/* Student List */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Student List</h2>
            </div>

            {(() => {
              // Auto-filter students based on selected class + section + keyword
              const displayStudents = students?.filter((s: any) => {
                if (!selectedClass) return false;
                const matchesSection = !selectedSection || s.class?.section === selectedSection;
                const keyword = searchKeyword.toLowerCase();
                const matchesKeyword = !searchKeyword.trim() ||
                  s.first_name?.toLowerCase().includes(keyword) ||
                  s.last_name?.toLowerCase().includes(keyword) ||
                  s.admission_number?.toLowerCase().includes(keyword) ||
                  s.roll_number?.toLowerCase().includes(keyword) ||
                  s.father_name?.toLowerCase().includes(keyword);
                return matchesSection && matchesKeyword;
              }) || [];

              return displayStudents.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Admission No</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Father Name</TableHead>
                        <TableHead>Date Of Birth</TableHead>
                        <TableHead>Mobile No.</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayStudents.map((student: any) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.class?.name}</TableCell>
                          <TableCell>{student.class?.section || "-"}</TableCell>
                          <TableCell>{student.admission_number}</TableCell>
                          <TableCell>
                            <button
                              className="text-primary hover:underline font-medium text-left"
                              onClick={() => {
                                setSelectedStudentForView(student);
                                setShowStudentDialog(true);
                              }}
                            >
                              {student.first_name} {student.last_name}
                            </button>
                          </TableCell>
                          <TableCell>{student.father_name || "-"}</TableCell>
                          <TableCell>
                            {student.date_of_birth
                              ? new Date(student.date_of_birth).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>{student.parent_phone || "-"}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedStudentForView(student);
                                setShowStudentDialog(true);
                              }}
                            >
                              Collect Fees
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="px-4 py-3 border-t bg-muted/50 text-sm text-muted-foreground">
                    Records: {displayStudents.length} of {students?.length || 0}
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
                    {!selectedClass ? "Select a class to view students." : "No students found with the current criteria."}
                  </p>
                </div>
              );
            })()}
          </div>
        </TabsContent>

        {/* Search Fees Payment Tab */}
        <TabsContent value="search-payment" className="mt-6">
          <SearchFeesPayment />
        </TabsContent>

        {/* Search Due Fees Tab */}
        <TabsContent value="search-due" className="mt-6">
          <SearchDueFees />
        </TabsContent>

        {/* Fees Master Tab */}
        <TabsContent value="fees-master" className="mt-6">
          <FeesMaster />
        </TabsContent>

        {/* Fees Setup Tab (Tuition) */}
        <TabsContent value="fees-setup" className="mt-6">
          <SimpleTuitionSetup />
        </TabsContent>

        {/* Fees Discount Tab */}
        <TabsContent value="fees-discount" className="mt-6">
          <FeesDiscount />
        </TabsContent>

        {/* Fees Reminder Tab */}
        <TabsContent value="fees-reminder" className="mt-6">
          <FeesReminder />
        </TabsContent>
      </Tabs>

      {/* Student Fee Details Dialog */}
      <StudentFeesDialog
        open={showStudentDialog}
        onOpenChange={setShowStudentDialog}
        student={selectedStudentForView}
        paymentAmounts={paymentAmounts}
        setPaymentAmounts={setPaymentAmounts}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        recordPaymentMutation={recordPaymentMutation}
        toast={toast}
      />
    </div>
  );
}
