import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Download, Eye, Calendar, Edit, FileEdit } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CreateTestDialog } from "@/components/tests/CreateTestDialog";
import { EnterMarksDialog } from "@/components/tests/EnterMarksDialog";
import { exportTestsToCSV } from "@/lib/test-csv-export";
import { Badge } from "@/components/ui/badge";

export default function Tests() {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [enterMarksTestId, setEnterMarksTestId] = useState<string | null>(null);

  // For marks entry tab
  const [marksClass, setMarksClass] = useState<string>("");
  const [marksSubject, setMarksSubject] = useState<string>("");
  const [marksTestId, setMarksTestId] = useState<string | null>(null);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tests, isLoading } = useQuery({
    queryKey: ["tests", selectedYear, selectedClass, selectedSubject, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("test_statistics")
        .select("*")
        .order("test_date", { ascending: false }) as any;

      if (selectedYear) query = query.eq("academic_year", selectedYear);
      if (selectedClass) query = query.eq("class_id", selectedClass);
      if (selectedSubject) query = query.eq("subject_id", selectedSubject);
      if (searchQuery) query = query.ilike("test_name", `%${searchQuery}%`);

      const { data: statsData, error } = await query;
      if (error) throw error;
      if (!statsData || statsData.length === 0) return [];

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

  // Tests for marks entry tab (filtered by class + subject)
  const { data: marksTests } = useQuery({
    queryKey: ["tests-for-marks", marksClass, marksSubject],
    queryFn: async () => {
      if (!marksClass) return [];
      let query = supabase
        .from("tests")
        .select("*, subjects(name)")
        .eq("class_id", marksClass)
        .order("test_date", { ascending: false });
      if (marksSubject) query = query.eq("subject_id", marksSubject);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!marksClass,
  });

  const handleExportCSV = () => {
    if (tests) exportTestsToCSV(tests);
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
          <p className="text-muted-foreground mt-1">Manage tests, enter scores, and track student performance</p>
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

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-grid">
          <TabsTrigger value="tests">All Tests</TabsTrigger>
          <TabsTrigger value="marks">Enter Marks</TabsTrigger>
        </TabsList>

        {/* ── All Tests Tab ── */}
        <TabsContent value="tests" className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedYear || undefined} onValueChange={(v) => setSelectedYear(v || "")}>
                <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedClass || undefined} onValueChange={(v) => setSelectedClass(v || "")}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section && `(${cls.section})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSubject || undefined} onValueChange={(v) => setSelectedSubject(v || "")}>
                <SelectTrigger><SelectValue placeholder="All Subjects" /></SelectTrigger>
                <SelectContent>
                  {subjects?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </Card>

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
                    <TableHead className="text-right">Pass %</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading tests...</TableCell>
                    </TableRow>
                  ) : tests && tests.length > 0 ? (
                    tests.map((test: any) => (
                      <TableRow key={test.test_id}>
                        <TableCell className="font-medium">{test.test_name}</TableCell>
                        <TableCell>{test.classes?.name} {test.classes?.section && `(${test.classes.section})`}</TableCell>
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
                          {test.pass_percentage !== null ? (
                            <Badge variant={test.pass_percentage >= 75 ? "default" : test.pass_percentage >= 50 ? "secondary" : "destructive"}>
                              {test.pass_percentage}%
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEnterMarksTestId(test.test_id)} title="Enter Marks">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Link to={`/tests/${test.test_id}`}>
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No tests found. Create your first test to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ── Enter Marks Tab ── */}
        <TabsContent value="marks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enter Student Marks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Step 1: Select Class</p>
                  <Select value={marksClass} onValueChange={(v) => { setMarksClass(v); setMarksTestId(null); }}>
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.section && `- ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Step 2: Filter by Subject (optional)</p>
                  <Select value={marksSubject} onValueChange={(v) => { setMarksSubject(v); setMarksTestId(null); }}>
                    <SelectTrigger><SelectValue placeholder="All subjects" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All subjects</SelectItem>
                      {subjects?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Step 3: Select Test</p>
                  <Select value={marksTestId || ""} onValueChange={(v) => setMarksTestId(v || null)} disabled={!marksClass}>
                    <SelectTrigger><SelectValue placeholder={marksClass ? "Select test" : "Select class first"} /></SelectTrigger>
                    <SelectContent>
                      {marksTests?.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} — {t.subjects?.name} ({format(new Date(t.test_date), "dd MMM yyyy")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {marksClass && (!marksTests || marksTests.length === 0) && (
                <p className="text-sm text-muted-foreground py-2">No tests found for this class. Create a test first.</p>
              )}

              {marksTestId && (
                <div className="border rounded-lg p-1">
                  <EnterMarksInline testId={marksTestId} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTestDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {enterMarksTestId && (
        <EnterMarksDialog
          testId={enterMarksTestId}
          open={!!enterMarksTestId}
          onOpenChange={(open) => !open && setEnterMarksTestId(null)}
        />
      )}
    </div>
  );
}

// Inline marks entry component embedded in the tab
import { useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserX, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MarkEntry {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

function EnterMarksInline({ testId }: { testId: string }) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tests").select("*").eq("id", testId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ["test-results-entry", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select(`*, students:student_id(id, first_name, last_name, admission_number)`)
        .eq("test_id", testId)
        .order("students(first_name)");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (results) {
      setMarks(
        results.map((r: any) => ({
          id: r.id,
          student_id: r.student_id,
          student_name: `${r.students?.first_name} ${r.students?.last_name}`,
          admission_number: r.students?.admission_number || "",
          marks_obtained: r.marks_obtained,
          is_absent: r.is_absent || false,
        }))
      );
    }
  }, [results]);

  const saveMarksMutation = useMutation({
    mutationFn: async () => {
      const updates = marks.map((mark) =>
        supabase.from("test_results").update({
          marks_obtained: mark.is_absent ? null : mark.marks_obtained,
          is_absent: mark.is_absent,
        }).eq("id", mark.id)
      );
      const res = await Promise.all(updates);
      const errs = res.filter((r) => r.error);
      if (errs.length > 0) throw errs[0].error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-results", testId] });
      queryClient.invalidateQueries({ queryKey: ["test-stats", testId] });
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      toast.success("Marks saved successfully");
    },
    onError: () => toast.error("Failed to save marks"),
  });

  const updateMark = (index: number, field: keyof MarkEntry, value: any) => {
    setMarks((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "is_absent" && value === true) updated[index].marks_obtained = null;
      return updated;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      let next = index + 1;
      while (next < marks.length && marks[next].is_absent) next++;
      if (next < marks.length) inputRefs.current[next]?.focus();
    }
  };

  const entered = marks.filter((m) => !m.is_absent && m.marks_obtained !== null).length;
  const absentCount = marks.filter((m) => m.is_absent).length;
  const avgScore = entered > 0
    ? (marks.filter((m) => !m.is_absent && m.marks_obtained !== null)
        .reduce((sum, m) => sum + (m.marks_obtained || 0), 0) / entered).toFixed(1)
    : null;

  if (!test) return null;

  return (
    <div className="space-y-3 p-3">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">
          Max: <span className="font-semibold text-foreground">{test.max_marks}</span>
        </span>
        <span className="text-sm text-muted-foreground">
          Pass: <span className="font-semibold text-foreground">{test.pass_marks}</span>
        </span>
        <Badge variant="outline">{entered + absentCount}/{marks.length} marked</Badge>
        {absentCount > 0 && <Badge variant="secondary">{absentCount} absent</Badge>}
        {avgScore && <Badge>Avg: {avgScore}</Badge>}
        <div className="ml-auto">
          <Button size="sm" onClick={() => saveMarksMutation.mutate()} disabled={saveMarksMutation.isPending}>
            <Save className="h-3 w-3 mr-1" />
            {saveMarksMutation.isPending ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading students...</div>
      ) : marks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No students found for this test.</div>
      ) : (
        <ScrollArea className="h-[450px] border rounded-md">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead className="w-28">Adm. No.</TableHead>
                <TableHead className="w-36">Marks <span className="text-muted-foreground font-normal">/ {test.max_marks}</span></TableHead>
                <TableHead className="w-20 text-center">%</TableHead>
                <TableHead className="w-20 text-center">Absent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((mark, index) => {
                const pct = mark.marks_obtained !== null && test.max_marks > 0
                  ? Math.round((mark.marks_obtained / test.max_marks) * 100)
                  : null;
                const passed = mark.marks_obtained !== null && mark.marks_obtained >= test.pass_marks;
                return (
                  <TableRow key={mark.id} className={cn(mark.is_absent && "opacity-50 bg-muted/20")}>
                    <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                    <TableCell className="font-medium text-sm">{mark.student_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{mark.admission_number}</TableCell>
                    <TableCell>
                      <Input
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="number"
                        min="0"
                        max={test.max_marks}
                        value={mark.marks_obtained ?? ""}
                        onChange={(e) => updateMark(index, "marks_obtained", e.target.value === "" ? null : parseFloat(e.target.value))}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        disabled={mark.is_absent}
                        className="h-8 w-24 text-center"
                        placeholder="—"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {mark.is_absent ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : pct !== null ? (
                        <span className={cn("text-xs font-semibold", passed ? "text-primary" : "text-destructive")}>
                          {pct}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => updateMark(index, "is_absent", !mark.is_absent)}
                        className={cn(
                          "rounded-full p-1 transition-colors",
                          mark.is_absent ? "text-destructive" : "text-muted-foreground hover:text-foreground"
                        )}
                        title={mark.is_absent ? "Mark present" : "Mark absent"}
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
      <p className="text-xs text-muted-foreground">Tip: Press Tab or Enter to move to the next student</p>
    </div>
  );
}
