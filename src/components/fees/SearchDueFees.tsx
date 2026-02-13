import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Search, DollarSign } from "lucide-react";

export function SearchDueFees() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedFeeGroup, setSelectedFeeGroup] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: feeCategories } = useQuery({
    queryKey: ["feeCategories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const sections = classes
    ? [...new Set(classes.filter((c) => c.section).map((c) => c.section!))]
    : [];

  const { data: dueFees, isLoading } = useQuery({
    queryKey: ["dueFees", selectedClass, selectedSection, selectedFeeGroup],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(id, first_name, last_name, admission_number, class_id, parent_phone, class:classes(name, section)),
          fee_category:fee_categories(id, name)
        `)
        .in("status", ["pending", "overdue", "partial"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: searched,
  });

  // Also fetch payments to calculate paid amounts
  const { data: payments } = useQuery({
    queryKey: ["allPayments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*");
      if (error) throw error;
      return data;
    },
    enabled: searched,
  });

  const paymentsByFeeId = (payments || []).reduce((acc: Record<string, number>, p: any) => {
    acc[p.fee_assignment_id] = (acc[p.fee_assignment_id] || 0) + Number(p.amount);
    return acc;
  }, {});

  // Filter fees
  const filtered = dueFees?.filter((f: any) => {
    const keyword = searchKeyword.toLowerCase();
    const matchesSearch =
      !searchKeyword ||
      f.student?.first_name?.toLowerCase().includes(keyword) ||
      f.student?.last_name?.toLowerCase().includes(keyword) ||
      f.student?.admission_number?.toLowerCase().includes(keyword);
    const matchesClass =
      !selectedClass || f.student?.class_id === selectedClass;
    const matchesSection =
      selectedSection === "all" || f.student?.class?.section === selectedSection;
    const matchesFeeGroup =
      selectedFeeGroup === "all" || f.fee_category_id === selectedFeeGroup;
    return matchesSearch && matchesClass && matchesSection && matchesFeeGroup;
  });

  // Group by student
  const studentMap: Record<string, { student: any; fees: any[]; totalAmount: number; totalPaid: number }> = {};
  filtered?.forEach((f: any) => {
    if (!f.student) return;
    const sid = f.student.id;
    if (!studentMap[sid]) {
      studentMap[sid] = { student: f.student, fees: [], totalAmount: 0, totalPaid: 0 };
    }
    const paid = paymentsByFeeId[f.id] || 0;
    studentMap[sid].fees.push(f);
    studentMap[sid].totalAmount += Number(f.amount);
    studentMap[sid].totalPaid += paid;
  });

  const studentList = Object.values(studentMap);

  return (
    <div className="space-y-4">
      {/* Select Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Fees Group</Label>
              <Select value={selectedFeeGroup} onValueChange={setSelectedFeeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {feeCategories?.map((fc: any) => (
                    <SelectItem key={fc.id} value={fc.id}>
                      {fc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Class</Label>
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
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSearched(true)} className="gap-1">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {searched && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Student List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Search..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="max-w-xs"
            />
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Admission No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Fees Group</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                    <TableHead className="text-right">Paid (₹)</TableHead>
                    <TableHead className="text-right">Discount (₹)</TableHead>
                    <TableHead className="text-right">Fine (₹)</TableHead>
                    <TableHead className="text-right">Balance (₹)</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map((entry) => {
                    const { student, fees, totalAmount, totalPaid } = entry;
                    const balance = totalAmount - totalPaid;
                    const feeNames = fees
                      .map((f: any) => f.fee_category?.name || "Fee")
                      .join(", ");
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          {student.class
                            ? `${student.class.name}${student.class.section ? "-" + student.class.section : ""}`
                            : "-"}
                        </TableCell>
                        <TableCell>{student.admission_number || "-"}</TableCell>
                        <TableCell className="font-medium">
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground">
                          {feeNames}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">0.00</TableCell>
                        <TableCell className="text-right">0.00</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="default" className="gap-1 text-xs">
                            <DollarSign className="h-3 w-3" /> Add Fees
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {studentList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        No due fees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
