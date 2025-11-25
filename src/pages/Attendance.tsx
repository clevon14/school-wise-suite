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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Today's Attendance</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {todayStats?.total ? `${todayStats.total} students marked today` : "Let's mark today's attendance"}
          </p>
        </div>
        <div className="flex gap-2">
          <CSVAttendanceImport>
            <Button variant="outline" className="flex-1 md:flex-none h-11">
              <Upload className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </CSVAttendanceImport>
          <AttendanceMarkingDialog>
            <Button className="flex-1 md:flex-none h-11">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Mark Attendance</span>
              <span className="sm:hidden">Mark</span>
            </Button>
          </AttendanceMarkingDialog>
        </div>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Total</CardTitle>
            <ClipboardCheck className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold">{todayStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Present</CardTitle>
            <div className="h-2 w-2 rounded-full bg-success" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-success">{todayStats?.present || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.present / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Absent</CardTitle>
            <div className="h-2 w-2 rounded-full bg-destructive" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-destructive">{todayStats?.absent || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.absent / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Late</CardTitle>
            <div className="h-2 w-2 rounded-full bg-warning" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-warning">{todayStats?.late || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.late / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-xs md:text-sm font-medium">Excused</CardTitle>
            <div className="h-2 w-2 rounded-full bg-info" />
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="text-xl md:text-2xl font-bold text-info">{todayStats?.excused || 0}</div>
            <p className="text-xs text-muted-foreground">
              {todayStats?.total ? Math.round((todayStats.excused / todayStats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="report" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:inline-grid">
          <TabsTrigger value="report" className="text-sm">Report</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
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
