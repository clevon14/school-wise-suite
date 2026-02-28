import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Phone, DollarSign, Bus, ClipboardCheck, TrendingUp, Award, FileText, Download, Calendar } from "lucide-react";
import { format, subDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { calculateGrade, calculatePercentage } from "@/lib/grade-calculator";
import { useEffect } from "react";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

  // ── Real-time subscriptions ──
  useEffect(() => {
    if (!id) return;

    const testResultsChannel = supabase
      .channel(`student-test-results-${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "test_results",
        filter: `student_id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["student-tests-profile", id] });
        queryClient.invalidateQueries({ queryKey: ["student-all-tests", id] });
      })
      .subscribe();

    const marksChannel = supabase
      .channel(`student-marks-${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "marks",
        filter: `student_id=eq.${id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["student-exam-marks", id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(testResultsChannel);
      supabase.removeChannel(marksChannel);
    };
  }, [id, queryClient]);

  // ── Student data ──
  const { data: student, isLoading } = useQuery({
    queryKey: ["student-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, class:classes(name, section)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // ── Attendance ──
  const { data: attendance } = useQuery({
    queryKey: ["student-attendance-30d", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("student_id", id!)
        .gte("date", thirtyDaysAgo)
        .lte("date", today);
      const total = data?.length || 0;
      const present = data?.filter((a) => a.status === "present").length || 0;
      const absent = data?.filter((a) => a.status === "absent").length || 0;
      const late = data?.filter((a) => a.status === "late").length || 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { total, present, absent, late, percentage };
    },
    enabled: !!id,
  });

  // ── Fees ──
  const { data: fees } = useQuery({
    queryKey: ["student-fees-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("fee_assignments")
        .select("amount, status, due_date, fee_category:fee_categories(name)")
        .eq("student_id", id!);
      const totalDue = data?.filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.amount), 0) || 0;
      const totalPaid = data?.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0) || 0;
      const overdue = data?.filter((f) => f.status === "pending" && f.due_date < today).length || 0;
      return { totalDue, totalPaid, overdue, records: data || [] };
    },
    enabled: !!id,
  });

  // ── All test results (full history) ──
  const { data: allTestResults } = useQuery({
    queryKey: ["student-all-tests", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select("id, marks_obtained, is_absent, test:tests(id, name, test_date, max_marks, pass_marks, subject:subjects(name), class:classes(name, section))")
        .eq("student_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // ── Exam marks ──
  const { data: examMarks } = useQuery({
    queryKey: ["student-exam-marks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select("id, marks_obtained, is_absent, remarks, exam_subject:exam_subjects(id, max_marks, pass_marks, exam_date, subject:subjects(name), exam:exams(id, name, exam_type))")
        .eq("student_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // ── Upcoming exams for student's class ──
  const { data: upcomingExams } = useQuery({
    queryKey: ["student-upcoming-exams", student?.class_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("id, name, exam_type, start_date, end_date")
        .eq("class_id", student!.class_id)
        .gte("end_date", today)
        .order("start_date");
      if (error) throw error;
      return data || [];
    },
    enabled: !!student?.class_id,
  });

  // ── Transport ──
  const { data: transport } = useQuery({
    queryKey: ["student-transport-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_transport")
        .select("*, route:bus_routes(route_name, route_number, bus:buses(bus_number)), stop:bus_stops(stop_name)")
        .eq("student_id", id!)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;
  if (!student) return <div className="flex items-center justify-center h-64"><p>Student not found</p></div>;

  // ── Computed performance metrics ──
  const completedTests = (allTestResults || []).filter((r: any) => !r.is_absent && r.marks_obtained !== null);
  const totalMarksObtained = completedTests.reduce((s: number, r: any) => s + (r.marks_obtained || 0), 0);
  const totalMaxMarks = completedTests.reduce((s: number, r: any) => s + (r.test?.max_marks || 0), 0);
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;
  const passedTests = completedTests.filter((r: any) => r.marks_obtained >= (r.test?.pass_marks || 0)).length;
  const failedTests = completedTests.length - passedTests;
  const overallGrade = totalMaxMarks > 0 ? calculateGrade(totalMarksObtained, totalMaxMarks) : null;

  const completedExams = (examMarks || []).filter((m: any) => !m.is_absent && m.marks_obtained !== null);
  const examTotalObtained = completedExams.reduce((s: number, m: any) => s + (m.marks_obtained || 0), 0);
  const examTotalMax = completedExams.reduce((s: number, m: any) => s + (m.exam_subject?.max_marks || 0), 0);
  const examPercentage = examTotalMax > 0 ? Math.round((examTotalObtained / examTotalMax) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={student.photo_url || undefined} />
            <AvatarFallback><User className="h-8 w-8" /></AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold">{student.first_name} {student.last_name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{student.class?.name} {student.class?.section ? `(${student.class.section})` : ""}</span>
              <span>•</span>
              <span>Adm: {student.admission_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{attendance?.percentage || 0}%</p>
                <p className="text-sm text-muted-foreground">Attendance</p>
              </div>
            </div>
            <Progress value={attendance?.percentage || 0} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{overallPercentage}%</p>
                <p className="text-sm text-muted-foreground">Test Avg</p>
              </div>
            </div>
            <Progress value={overallPercentage} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">{overallGrade?.grade || "—"}</p>
                <p className="text-sm text-muted-foreground">Overall Grade</p>
              </div>
            </div>
            <div className="mt-2">
              <Badge variant={passedTests > failedTests ? "default" : "destructive"}>
                {passedTests}P / {failedTests}F
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">₹{((fees?.totalDue || 0) / 1000).toFixed(1)}k</p>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
              </div>
            </div>
            {(fees?.overdue || 0) > 0 && <Badge variant="destructive" className="mt-2">{fees?.overdue} overdue</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bus className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">{transport ? "Active" : "None"}</p>
                <p className="text-sm text-muted-foreground">Transport</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="academics" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-grid">
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        {/* ── ACADEMICS TAB ── */}
        <TabsContent value="academics" className="space-y-4">
          {/* Upcoming Exams */}
          {upcomingExams && upcomingExams.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> Upcoming Exams</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingExams.map((exam: any) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{exam.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{exam.exam_type.replace("_", " ")}</p>
                      </div>
                      <Badge variant="outline">
                        {format(new Date(exam.start_date), "MMM d")} – {format(new Date(exam.end_date), "MMM d")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Performance Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 border rounded-lg">
                  <p className="text-2xl font-bold">{completedTests.length}</p>
                  <p className="text-xs text-muted-foreground">Tests Taken</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-2xl font-bold">{totalMarksObtained}/{totalMaxMarks}</p>
                  <p className="text-xs text-muted-foreground">Total Marks</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-success">{passedTests}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{failedTests}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Test Results */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Test History</CardTitle></CardHeader>
            <CardContent>
              {allTestResults && allTestResults.length > 0 ? (
                <div className="space-y-2">
                  {allTestResults.map((result: any) => {
                    const test = result.test;
                    if (!test) return null;
                    const pct = result.marks_obtained !== null && !result.is_absent
                      ? calculatePercentage(result.marks_obtained, test.max_marks)
                      : null;
                    const grade = result.marks_obtained !== null && !result.is_absent
                      ? calculateGrade(result.marks_obtained, test.max_marks)
                      : null;
                    const passed = result.marks_obtained !== null && result.marks_obtained >= test.pass_marks;

                    return (
                      <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{test.name}</p>
                            {result.is_absent ? (
                              <Badge variant="secondary">Absent</Badge>
                            ) : result.marks_obtained !== null ? (
                              <>
                                {grade && <Badge className={grade.color}>{grade.grade}</Badge>}
                                {!passed && <Badge variant="destructive">Failed</Badge>}
                              </>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {test.subject?.name} • {format(new Date(test.test_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        {!result.is_absent && result.marks_obtained !== null && (
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold">{result.marks_obtained}/{test.max_marks}</p>
                            <p className="text-sm text-muted-foreground">{pct}%</p>
                            <Progress value={pct || 0} className="mt-1 h-2 w-24" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center py-6 text-muted-foreground">No test results yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── EXAMS TAB ── */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Exam Results</CardTitle></CardHeader>
            <CardContent>
              {examMarks && examMarks.length > 0 ? (
                <>
                  {/* Exam summary */}
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{completedExams.length}</p>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{examTotalObtained}/{examTotalMax}</p>
                      <p className="text-xs text-muted-foreground">Total Marks</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-2xl font-bold">{examPercentage}%</p>
                      <p className="text-xs text-muted-foreground">Percentage</p>
                    </div>
                  </div>

                  {/* Group by exam */}
                  {(() => {
                    const grouped: Record<string, any[]> = {};
                    examMarks.forEach((m: any) => {
                      const examName = m.exam_subject?.exam?.name || "Unknown Exam";
                      if (!grouped[examName]) grouped[examName] = [];
                      grouped[examName].push(m);
                    });
                    return Object.entries(grouped).map(([examName, marks]) => (
                      <div key={examName} className="mb-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {examName}
                        </h4>
                        <div className="space-y-2">
                          {marks.map((m: any) => {
                            const es = m.exam_subject;
                            if (!es) return null;
                            const pct = m.marks_obtained !== null && !m.is_absent
                              ? calculatePercentage(m.marks_obtained, es.max_marks)
                              : null;
                            const grade = m.marks_obtained !== null && !m.is_absent
                              ? calculateGrade(m.marks_obtained, es.max_marks)
                              : null;
                            const passed = m.marks_obtained !== null && m.marks_obtained >= es.pass_marks;

                            return (
                              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{es.subject?.name}</p>
                                  <div className="flex items-center gap-2">
                                    {m.is_absent ? (
                                      <Badge variant="secondary">Absent</Badge>
                                    ) : m.marks_obtained !== null ? (
                                      <>
                                        {grade && <Badge className={grade.color}>{grade.grade}</Badge>}
                                        {!passed && <Badge variant="destructive">Failed</Badge>}
                                      </>
                                    ) : (
                                      <Badge variant="outline">Pending</Badge>
                                    )}
                                  </div>
                                </div>
                                {!m.is_absent && m.marks_obtained !== null && (
                                  <div className="text-right">
                                    <p className="text-lg font-bold">{m.marks_obtained}/{es.max_marks}</p>
                                    <p className="text-sm text-muted-foreground">{pct}%</p>
                                    <Progress value={pct || 0} className="mt-1 h-2 w-24" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </>
              ) : (
                <p className="text-center py-6 text-muted-foreground">No exam results yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PERSONAL TAB ── */}
        <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Date of Birth" value={student.date_of_birth ? format(new Date(student.date_of_birth), "dd MMM yyyy") : "-"} />
                <InfoRow label="Gender" value={student.gender || "-"} />
                <InfoRow label="Blood Group" value={student.blood_group || "-"} />
                <InfoRow label="Category" value={student.category || "-"} />
                <InfoRow label="Village" value={student.village || "-"} />
                <InfoRow label="Address" value={student.address || "-"} />
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Parent / Guardian</p>
                  <InfoRow label="Father" value={student.father_name || "-"} />
                  <InfoRow label="Mother" value={student.mother_name || "-"} />
                  {student.parent_phone && (
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${student.parent_phone}`} className="text-primary hover:underline">{student.parent_phone}</a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Attendance (Last 30 Days)</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{attendance?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-success">{attendance?.present || 0}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{attendance?.absent || 0}</p>
                    <p className="text-xs text-muted-foreground">Absent</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">{attendance?.late || 0}</p>
                    <p className="text-xs text-muted-foreground">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {transport && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Transport</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Route" value={`${transport.route?.route_name} (${transport.route?.route_number})`} />
                  <InfoRow label="Bus" value={transport.route?.bus?.bus_number || "-"} />
                  <InfoRow label="Stop" value={transport.stop?.stop_name || "-"} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── FEES TAB ── */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Fee Status</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-xl font-bold text-success">₹{(fees?.totalPaid || 0).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-xl font-bold text-destructive">₹{(fees?.totalDue || 0).toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">Total Due</p>
                </div>
              </div>
              {fees?.records && fees.records.filter((f: any) => f.status === "pending").length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Pending Fees:</p>
                  {fees.records.filter((f: any) => f.status === "pending").map((f: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm p-2 border rounded">
                      <span>{f.fee_category?.name || "Fee"}</span>
                      <span className="font-medium">₹{Number(f.amount).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
