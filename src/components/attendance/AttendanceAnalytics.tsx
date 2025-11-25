import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, Users, Calendar, AlertCircle } from "lucide-react";

const STATUS_COLORS = {
  present: "hsl(var(--success))",
  absent: "hsl(var(--destructive))",
  late: "hsl(var(--warning))",
  excused: "hsl(var(--info))",
};

export function AttendanceAnalytics() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["attendance-analytics", selectedClass, dateRange],
    queryFn: async () => {
      const startDate = format(
        subDays(new Date(), parseInt(dateRange)),
        "yyyy-MM-dd"
      );
      const endDate = format(new Date(), "yyyy-MM-dd");

      let query = supabase
        .from("attendance")
        .select(`
          *,
          student:students(
            id,
            first_name,
            last_name,
            admission_number,
            class:classes(id, name, section)
          )
        `)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date");

      if (selectedClass !== "all") {
        const { data: students } = await supabase
          .from("students")
          .select("id")
          .eq("class_id", selectedClass);

        if (students && students.length > 0) {
          query = query.in("student_id", students.map((s) => s.id));
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!attendanceData) return null;

    const total = attendanceData.length;
    const present = attendanceData.filter((r) => r.status === "present").length;
    const absent = attendanceData.filter((r) => r.status === "absent").length;
    const late = attendanceData.filter((r) => r.status === "late").length;
    const excused = attendanceData.filter((r) => r.status === "excused").length;

    const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0;
    const absenteeRate = total > 0 ? (absent / total) * 100 : 0;

    return {
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate: attendanceRate.toFixed(1),
      absenteeRate: absenteeRate.toFixed(1),
    };
  }, [attendanceData]);

  // Daily trend data
  const trendData = useMemo(() => {
    if (!attendanceData) return [];

    const dateMap = new Map<string, any>();

    attendanceData.forEach((record) => {
      const date = record.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date: format(new Date(date), "MMM dd"),
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }

      const dayData = dateMap.get(date);
      dayData[record.status]++;
      dayData.total++;
    });

    return Array.from(dateMap.values()).map((day) => ({
      ...day,
      rate: day.total > 0 ? ((day.present + day.late) / day.total) * 100 : 0,
    }));
  }, [attendanceData]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    if (!stats) return [];

    return [
      { name: "Present", value: stats.present, color: STATUS_COLORS.present },
      { name: "Absent", value: stats.absent, color: STATUS_COLORS.absent },
      { name: "Late", value: stats.late, color: STATUS_COLORS.late },
      { name: "Excused", value: stats.excused, color: STATUS_COLORS.excused },
    ].filter((item) => item.value > 0);
  }, [stats]);

  // Student-wise statistics
  const studentStats = useMemo(() => {
    if (!attendanceData) return [];

    const studentMap = new Map<string, any>();

    attendanceData.forEach((record) => {
      const studentId = record.student_id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          name: `${record.student?.first_name} ${record.student?.last_name}`,
          admissionNo: record.student?.admission_number,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        });
      }

      const student = studentMap.get(studentId);
      student[record.status]++;
      student.total++;
    });

    return Array.from(studentMap.values())
      .map((student) => ({
        ...student,
        rate:
          student.total > 0
            ? ((student.present + student.late) / student.total) * 100
            : 0,
      }))
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 10);
  }, [attendanceData]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
          <CardDescription>
            Comprehensive insights into attendance patterns and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="180">Last 6 months</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedClass}
              onValueChange={setSelectedClass}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes?.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.present + stats.late} of {stats.total} records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Across selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Absentee Rate
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.absenteeRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.absent} absent records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Present Students
              </CardTitle>
              <Users className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.present}</div>
              <p className="text-xs text-muted-foreground">
                {stats.late} late arrivals
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Trend Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Daily attendance rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  label={{ value: "Rate (%)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Attendance Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Breakdown by attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Status Breakdown</CardTitle>
            <CardDescription>Status counts by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill={STATUS_COLORS.present} name="Present" />
                <Bar dataKey="absent" fill={STATUS_COLORS.absent} name="Absent" />
                <Bar dataKey="late" fill={STATUS_COLORS.late} name="Late" />
                <Bar dataKey="excused" fill={STATUS_COLORS.excused} name="Excused" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student-wise Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance Rates</CardTitle>
            <CardDescription>
              Top 10 students with lowest attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip />
                <Bar dataKey="rate" fill="hsl(var(--primary))" name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Student Table */}
      {studentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Student Statistics</CardTitle>
            <CardDescription>
              Individual student attendance breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Admission No.</th>
                    <th className="text-right p-2">Present</th>
                    <th className="text-right p-2">Absent</th>
                    <th className="text-right p-2">Late</th>
                    <th className="text-right p-2">Excused</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {studentStats.map((student, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{student.name}</td>
                      <td className="p-2">{student.admissionNo}</td>
                      <td className="text-right p-2">{student.present}</td>
                      <td className="text-right p-2">{student.absent}</td>
                      <td className="text-right p-2">{student.late}</td>
                      <td className="text-right p-2">{student.excused}</td>
                      <td className="text-right p-2">{student.total}</td>
                      <td className="text-right p-2 font-medium">
                        {student.rate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
