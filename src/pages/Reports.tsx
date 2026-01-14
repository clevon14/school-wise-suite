import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Download
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

export default function Reports() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch students summary
  const { data: studentSummary } = useQuery({
    queryKey: ["student-summary-report", selectedClass],
    queryFn: async () => {
      let query = supabase.from("students").select("id, status, class_id, village");
      if (selectedClass !== "all") {
        query = query.eq("class_id", selectedClass);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      const total = data?.length || 0;
      const active = data?.filter(s => s.status === "active").length || 0;
      const villages = [...new Set(data?.map(s => s.village).filter(Boolean))];
      
      return { total, active, inactive: total - active, villages: villages.length };
    },
  });

  // Fetch attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ["attendance-report", selectedClass, dateRange],
    queryFn: async () => {
      const startDate = dateRange === "week" ? subDays(new Date(), 7) : startOfMonth(new Date());
      const endDate = new Date();
      
      let studentQuery = supabase.from("students").select("id, class_id");
      if (selectedClass !== "all") {
        studentQuery = studentQuery.eq("class_id", selectedClass);
      }
      const { data: students } = await studentQuery.eq("status", "active");
      const studentIds = students?.map(s => s.id) || [];

      if (studentIds.length === 0) return { present: 0, absent: 0, late: 0, rate: 0, dailyData: [] };

      const { data, error } = await supabase
        .from("attendance")
        .select("status, date")
        .in("student_id", studentIds)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .lte("date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      const present = data?.filter(a => a.status === "present").length || 0;
      const absent = data?.filter(a => a.status === "absent").length || 0;
      const late = data?.filter(a => a.status === "late").length || 0;
      const total = present + absent + late;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      // Group by date for chart
      const grouped = data?.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) acc[date] = { date, present: 0, absent: 0, late: 0 };
        if (item.status === "present") acc[date].present++;
        else if (item.status === "absent") acc[date].absent++;
        else if (item.status === "late") acc[date].late++;
        return acc;
      }, {} as Record<string, { date: string; present: number; absent: number; late: number }>);

      const dailyData = Object.values(grouped || {}).slice(-7);

      return { present, absent, late, rate, dailyData };
    },
  });

  // Fetch test/exam data
  const { data: examData } = useQuery({
    queryKey: ["exam-report", selectedClass],
    queryFn: async () => {
      let query = supabase.from("tests").select(`
        id, name, max_marks, pass_marks, class_id, subject_id,
        subjects(name),
        test_results(marks_obtained, is_absent)
      `);
      if (selectedClass !== "all") {
        query = query.eq("class_id", selectedClass);
      }
      const { data, error } = await query.order("test_date", { ascending: false }).limit(10);
      if (error) throw error;

      const testsWithStats = data?.map(test => {
        const results = (test.test_results || []).filter((r: any) => !r.is_absent && r.marks_obtained !== null);
        const total = results.length;
        const passed = results.filter((r: any) => r.marks_obtained >= test.pass_marks).length;
        const avg = total > 0 ? results.reduce((sum: number, r: any) => sum + r.marks_obtained, 0) / total : 0;
        return {
          name: test.name,
          subject: (test.subjects as any)?.name || "Unknown",
          avgScore: Math.round(avg),
          passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
          total,
          passed,
        };
      });

      return testsWithStats || [];
    },
  });

  // Fetch fees data
  const { data: feesData } = useQuery({
    queryKey: ["fees-report", selectedClass],
    queryFn: async () => {
      let studentQuery = supabase.from("students").select("id, class_id");
      if (selectedClass !== "all") {
        studentQuery = studentQuery.eq("class_id", selectedClass);
      }
      const { data: students } = await studentQuery.eq("status", "active");
      const studentIds = students?.map(s => s.id) || [];

      if (studentIds.length === 0) return { collected: 0, pending: 0, total: 0, rate: 0, categoryData: [] };

      const { data: assignments, error } = await supabase
        .from("fee_assignments")
        .select(`
          amount, status,
          fee_categories(name)
        `)
        .in("student_id", studentIds);

      if (error) throw error;

      const collected = assignments?.filter(a => a.status === "paid").reduce((sum, a) => sum + a.amount, 0) || 0;
      const pending = assignments?.filter(a => a.status === "pending").reduce((sum, a) => sum + a.amount, 0) || 0;
      const total = collected + pending;
      const rate = total > 0 ? Math.round((collected / total) * 100) : 0;

      // Group by category
      const categoryMap = assignments?.reduce((acc, a) => {
        const name = (a.fee_categories as any)?.name || "Other";
        if (!acc[name]) acc[name] = { name, collected: 0, pending: 0 };
        if (a.status === "paid") acc[name].collected += a.amount;
        else acc[name].pending += a.amount;
        return acc;
      }, {} as Record<string, { name: string; collected: number; pending: number }>);

      const categoryData = Object.values(categoryMap || {});

      return { collected, pending, total, rate, categoryData };
    },
  });

  // Fetch syllabus progress
  const { data: syllabusData } = useQuery({
    queryKey: ["syllabus-report", selectedClass],
    queryFn: async () => {
      let query = supabase.from("syllabus_topics").select(`
        id, topic_name, subject_id,
        subjects(name),
        syllabus_progress(status)
      `);
      if (selectedClass !== "all") {
        query = query.eq("class_id", selectedClass);
      }
      const { data, error } = await query;
      if (error) throw error;

      const total = data?.length || 0;
      const completed = data?.filter(t => (t.syllabus_progress as any[])?.[0]?.status === "completed").length || 0;
      const inProgress = data?.filter(t => (t.syllabus_progress as any[])?.[0]?.status === "in_progress").length || 0;
      const notStarted = total - completed - inProgress;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Group by subject
      const subjectMap = data?.reduce((acc, t) => {
        const name = (t.subjects as any)?.name || "Unknown";
        if (!acc[name]) acc[name] = { name, completed: 0, inProgress: 0, notStarted: 0 };
        const status = (t.syllabus_progress as any[])?.[0]?.status;
        if (status === "completed") acc[name].completed++;
        else if (status === "in_progress") acc[name].inProgress++;
        else acc[name].notStarted++;
        return acc;
      }, {} as Record<string, { name: string; completed: number; inProgress: number; notStarted: number }>);

      const subjectData = Object.values(subjectMap || {});

      return { total, completed, inProgress, notStarted, rate, subjectData };
    },
  });

  // Fetch timetable summary
  const { data: timetableData } = useQuery({
    queryKey: ["timetable-report", selectedClass],
    queryFn: async () => {
      let query = supabase.from("timetable").select(`
        id, day_of_week, subject_id,
        subjects(name)
      `);
      if (selectedClass !== "all") {
        query = query.eq("class_id", selectedClass);
      }
      const { data, error } = await query;
      if (error) throw error;

      const totalPeriods = data?.length || 0;
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      const dayDistribution = days.map((day, idx) => ({
        name: day.substring(0, 3),
        periods: data?.filter(t => t.day_of_week === idx).length || 0,
      })).filter(d => d.periods > 0);

      const subjectDistribution = data?.reduce((acc, t) => {
        const name = (t.subjects as any)?.name || "Unknown";
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const subjectData = Object.entries(subjectDistribution || {}).map(([name, value]) => ({
        name,
        value,
      }));

      return { totalPeriods, dayDistribution, subjectData };
    },
  });

  // Fetch subjects summary
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, code");
      if (error) throw error;
      return data || [];
    },
  });

  const attendancePieData = [
    { name: "Present", value: attendanceData?.present || 0 },
    { name: "Absent", value: attendanceData?.absent || 0 },
    { name: "Late", value: attendanceData?.late || 0 },
  ].filter(d => d.value > 0);

  const feesPieData = [
    { name: "Collected", value: feesData?.collected || 0 },
    { name: "Pending", value: feesData?.pending || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">Comprehensive analysis of school data</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}{cls.section ? ` - ${cls.section}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="This Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{studentSummary?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{attendanceData?.rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{feesData?.rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Fee Collection</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{syllabusData?.rate || 0}%</p>
                <p className="text-xs text-muted-foreground">Syllabus Done</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{timetableData?.totalPeriods || 0}</p>
                <p className="text-xs text-muted-foreground">Weekly Periods</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-2xl font-bold">{subjectsData?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Overview</CardTitle>
                <CardDescription>Distribution of students by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Active Students</span>
                    <Badge variant="default">{studentSummary?.active || 0}</Badge>
                  </div>
                  <Progress value={studentSummary?.total ? (studentSummary.active / studentSummary.total) * 100 : 0} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span>Inactive Students</span>
                    <Badge variant="secondary">{studentSummary?.inactive || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Villages Covered</span>
                    <Badge variant="outline">{studentSummary?.villages || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Class Distribution</CardTitle>
                <CardDescription>Students per class</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {classes.map((cls) => (
                      <div key={cls.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span>{cls.name}{cls.section ? ` - ${cls.section}` : ""}</span>
                        <Badge variant="outline">-</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>Overall attendance breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {attendancePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No attendance data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Trend</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {attendanceData?.dailyData && attendanceData.dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "dd MMM")} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" fill="#22c55e" name="Present" />
                      <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                      <Bar dataKey="late" fill="#f59e0b" name="Late" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No daily data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tests Performance</CardTitle>
              <CardDescription>Average scores and pass rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {examData && examData.length > 0 ? examData.map((test, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{test.name}</p>
                          <p className="text-sm text-muted-foreground">{test.subject}</p>
                        </div>
                        <Badge variant={test.passRate >= 70 ? "default" : test.passRate >= 50 ? "secondary" : "destructive"}>
                          {test.passRate}% Pass Rate
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>Avg Score: <strong>{test.avgScore}</strong></span>
                        <span>Passed: <strong>{test.passed}/{test.total}</strong></span>
                      </div>
                      <Progress value={test.passRate} className="h-2" />
                    </div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No test data available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees Tab */}
        <TabsContent value="fees" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Status</CardTitle>
                <CardDescription>Overall fee collection</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {feesPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feesPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No fee data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Collection by fee type</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {feesData?.categoryData && feesData.categoryData.length > 0 ? feesData.categoryData.map((cat, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ₹{cat.collected.toLocaleString()} / ₹{(cat.collected + cat.pending).toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={(cat.collected + cat.pending) > 0 ? (cat.collected / (cat.collected + cat.pending)) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    )) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No category data available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">₹{(feesData?.collected || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">₹{(feesData?.pending || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{(feesData?.total || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Syllabus Tab */}
        <TabsContent value="syllabus" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>Syllabus completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Completed</span>
                    </div>
                    <Badge variant="default">{syllabusData?.completed || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span>In Progress</span>
                    </div>
                    <Badge variant="secondary">{syllabusData?.inProgress || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>Not Started</span>
                    </div>
                    <Badge variant="outline">{syllabusData?.notStarted || 0}</Badge>
                  </div>
                  <Progress value={syllabusData?.rate || 0} className="h-3" />
                  <p className="text-center text-sm text-muted-foreground">
                    {syllabusData?.rate || 0}% Complete
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Progress</CardTitle>
                <CardDescription>Completion by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  <div className="space-y-3">
                    {syllabusData?.subjectData && syllabusData.subjectData.length > 0 ? syllabusData.subjectData.map((sub, idx) => {
                      const total = sub.completed + sub.inProgress + sub.notStarted;
                      const rate = total > 0 ? Math.round((sub.completed / total) * 100) : 0;
                      return (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{sub.name}</span>
                            <span className="text-sm">{rate}%</span>
                          </div>
                          <Progress value={rate} className="h-2" />
                          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="text-green-600">{sub.completed} done</span>
                            <span className="text-blue-600">{sub.inProgress} ongoing</span>
                            <span className="text-orange-600">{sub.notStarted} pending</span>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No syllabus data available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timetable Tab */}
        <TabsContent value="timetable" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Periods by Day</CardTitle>
                <CardDescription>Weekly distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {timetableData?.dayDistribution && timetableData.dayDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timetableData.dayDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="periods" fill="hsl(var(--primary))" name="Periods" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No timetable data available
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Periods per subject</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {timetableData?.subjectData && timetableData.subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={timetableData.subjectData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {timetableData.subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No subject data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
