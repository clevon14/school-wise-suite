import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export function StudentTransportFees() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searched, setSearched] = useState(false);

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
                          {activeTransport && (
                            <Button
                              size="icon"
                              variant="default"
                              className="h-8 w-8 rounded-full"
                              title="Collect Bus Fee"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
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
    </div>
  );
}
