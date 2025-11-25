import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, Plus, Upload } from "lucide-react";
import { AttendanceMarkingDialog } from "@/components/attendance/AttendanceMarkingDialog";
import { AttendanceReport } from "@/components/attendance/AttendanceReport";
import { AttendanceAnalytics } from "@/components/attendance/AttendanceAnalytics";
import { CSVAttendanceImport } from "@/components/attendance/CSVAttendanceImport";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Attendance() {
  const { data: todayStats } = useQuery({
    queryKey: ["today-attendance-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("date", today);
      
      const present = data?.filter(a => a.status === "present").length || 0;
      const absent = data?.filter(a => a.status === "absent").length || 0;
      const late = data?.filter(a => a.status === "late").length || 0;
      const excused = data?.filter(a => a.status === "excused").length || 0;
      const total = data?.length || 0;
      
      return { present, absent, late, excused, total };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
          <p className="text-muted-foreground">Track daily attendance for students</p>
        </div>
        <div className="flex gap-2">
          <CSVAttendanceImport>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </CSVAttendanceImport>
          <AttendanceMarkingDialog>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
          </AttendanceMarkingDialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Marked</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <div className="h-2 w-2 rounded-full bg-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{todayStats?.present || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.present / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <div className="h-2 w-2 rounded-full bg-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{todayStats?.absent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.absent / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <div className="h-2 w-2 rounded-full bg-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{todayStats?.late || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.late / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <div className="h-2 w-2 rounded-full bg-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{todayStats?.excused || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.excused / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="report" className="space-y-4">
        <TabsList>
          <TabsTrigger value="report">Attendance Report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="report" className="space-y-4">
          <AttendanceReport />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <AttendanceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
