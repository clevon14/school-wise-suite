import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, ClipboardCheck, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: studentsCount } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: teachersCount } = useQuery({
    queryKey: ["teachers-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ["today-attendance"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("attendance")
        .select("status")
        .eq("date", today);
      
      const present = data?.filter(a => a.status === "present").length || 0;
      const absent = data?.filter(a => a.status === "absent").length || 0;
      
      return { present, absent };
    },
  });

  const stats = [
    {
      title: "Total Students",
      value: studentsCount || 0,
      icon: GraduationCap,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Teachers",
      value: teachersCount || 0,
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Present Today",
      value: todayAttendance?.present || 0,
      icon: ClipboardCheck,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Absent Today",
      value: todayAttendance?.absent || 0,
      icon: TrendingUp,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm md:text-base text-muted-foreground">Welcome back! Here's an overview of your school.</p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <p className="text-sm text-muted-foreground">Activity tracking coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 md:px-6">
            <p className="text-sm text-muted-foreground">Quick action buttons coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
