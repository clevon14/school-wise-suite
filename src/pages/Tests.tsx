import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Download, Eye, Calendar, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CreateTestDialog } from "@/components/tests/CreateTestDialog";
import { exportTestsToCSV } from "@/lib/test-csv-export";
import { Badge } from "@/components/ui/badge";

export default function Tests() {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch classes
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

  // Fetch subjects
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch tests with statistics
  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests", selectedYear, selectedClass, selectedSubject, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("test_statistics")
        .select("*")
        .order("test_date", { ascending: false }) as any;

      if (selectedYear) {
        query = query.eq("academic_year", selectedYear);
      }
      if (selectedClass) {
        query = query.eq("class_id", selectedClass);
      }
      if (selectedSubject) {
        query = query.eq("subject_id", selectedSubject);
      }
      if (searchQuery) {
        query = query.ilike("test_name", `%${searchQuery}%`);
      }

      const { data: statsData, error } = await query;
      if (error) throw error;

      if (!statsData || statsData.length === 0) return [];

      // Fetch related data separately
      const classIds = [...new Set(statsData.map((t: any) => t.class_id))] as string[];
      const subjectIds = [...new Set(statsData.map((t: any) => t.subject_id))] as string[];

      const [classesRes, subjectsRes] = await Promise.all([
        supabase.from("classes").select("*").in("id", classIds),
        supabase.from("subjects").select("*").in("id", subjectIds),
      ]);

      return statsData.map((test: any) => ({
        ...test,
        classes: classesRes.data?.find((c: any) => c.id === test.class_id),
        subjects: subjectsRes.data?.find((s: any) => s.id === test.subject_id),
      }));
    },
  });

  const handleExportCSV = () => {
    if (tests) {
      exportTestsToCSV(tests);
    }
  };

  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i;
    return `${year}-${year + 1}`;
  });

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tests & Results</h1>
          <p className="text-muted-foreground mt-1">
            Manage tests, enter scores, and track student performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Select value={selectedYear || undefined} onValueChange={(value) => setSelectedYear(value || "")}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedYear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedYear("")}
                className="w-full h-8"
              >
                Clear Filter
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Select value={selectedClass || undefined} onValueChange={(value) => setSelectedClass(value || "")}>
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `(${cls.section})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClass && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedClass("")}
                className="w-full h-8"
              >
                Clear Filter
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Select value={selectedSubject || undefined} onValueChange={(value) => setSelectedSubject(value || "")}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSubject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedSubject("")}
                className="w-full h-8"
              >
                Clear Filter
              </Button>
            )}
          </div>

          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Tests Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Median</TableHead>
                <TableHead className="text-right">Pass %</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading tests...
                  </TableCell>
                </TableRow>
              ) : tests && tests.length > 0 ? (
                tests.map((test: any) => (
                  <TableRow key={test.test_id}>
                    <TableCell className="font-medium">{test.test_name}</TableCell>
                    <TableCell>
                      {test.classes?.name} {test.classes?.section && `(${test.classes.section})`}
                    </TableCell>
                    <TableCell>{test.subjects?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(test.test_date), "MMM dd, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{test.total_students}</TableCell>
                    <TableCell className="text-right">
                      {test.avg_score ? `${test.avg_score}/${test.max_marks}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {test.median_score ? test.median_score.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {test.pass_percentage !== null ? (
                        <Badge 
                          variant={test.pass_percentage >= 75 ? "default" : test.pass_percentage >= 50 ? "secondary" : "destructive"}
                        >
                          {test.pass_percentage}%
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/tests/${test.test_id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No tests found. Create your first test to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateTestDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
