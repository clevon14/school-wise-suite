import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Search } from "lucide-react";
import { CollectTuitionFeeDialog } from "@/components/fees/CollectTuitionFeeDialog";
import { CollectBusFeeDialog } from "@/components/fees/CollectBusFeeDialog";
import { SimpleTuitionSetup } from "@/components/fees/SimpleTuitionSetup";
import { SimpleBusSetup } from "@/components/fees/SimpleBusSetup";
import { exportFeesCSV } from "@/lib/fee-csv-export";
import { useToast } from "@/hooks/use-toast";
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
    queryKey: ["students-for-fees", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      
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
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("first_name");

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClass,
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

  const collectFeesMutation = useMutation({
    mutationFn: async () => {
      const updates = selectedStudents.map(async (studentId) => {
        const student = filteredStudents.find((s: any) => s.id === studentId);
        if (!student?.fee_assignments?.length) return;

        const pendingFees = student.fee_assignments.filter(
          (f: any) => f.status === "pending"
        );

        for (const fee of pendingFees) {
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
    </div>
  );
}
