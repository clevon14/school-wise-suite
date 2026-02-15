import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, ClipboardCheck, UserCheck, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ActionAlerts } from "@/components/dashboard/ActionAlerts";
import { ClassStrengthTable } from "@/components/dashboard/ClassStrengthTable";

export default function Dashboard() {
  const { data: studentsCount } = useQuery({
    queryKey: ["students-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count || 0;
    },
  });

  const { data: teachersCount } = useQuery({
    queryKey: ["teachers-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
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
      const late = data?.filter(a => a.status === "late").length || 0;
      
      return { present, absent, late, total: data?.length || 0 };
    },
  });

  const { data: feesData } = useQuery({
    queryKey: ["fees-summary"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fee_assignments")
        .select("status, amount");
      
      const pending = data?.filter(f => f.status === "pending").reduce((sum, f) => sum + f.amount, 0) || 0;
      const paid = data?.filter(f => f.status === "paid").reduce((sum, f) => sum + f.amount, 0) || 0;
      const partial = data?.filter(f => f.status === "partial").length || 0;
      
      return { pending, paid, partial, totalDue: data?.filter(f => f.status === "pending").length || 0 };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: monthlyFees } = useQuery({
    queryKey: ["monthly-fees-chart"],
    queryFn: async () => {
      const currentDate = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: payments } = await supabase
        .from("payments")
        .select("payment_date, amount")
        .gte("payment_date", thirtyDaysAgo.toISOString().split("T")[0]);
      
      // Group by date
      const grouped = payments?.reduce((acc: any, payment) => {
        const date = new Date(payment.payment_date).getDate();
        if (!acc[date]) acc[date] = 0;
        acc[date] += payment.amount;
        return acc;
      }, {}) || {};
      
      return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        collection: grouped[i + 1] || 0,
      }));
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: incomeBreakdown } = useQuery({
    queryKey: ["income-breakdown"],
    queryFn: async () => {
      // Get actual payments with fee categories
      const { data: payments } = await supabase
        .from("payments")
        .select(`
          amount,
          fee_assignment:fee_assignments(
            fee_category:fee_categories(name)
          )
        `);
      
      // Group by fee category
      const breakdown = payments?.reduce((acc: any[], payment) => {
        const categoryName = payment.fee_assignment?.fee_category?.name || "Other";
        const existing = acc.find(item => item.name === categoryName);
        if (existing) {
          existing.value += payment.amount;
        } else {
          acc.push({ name: categoryName, value: payment.amount });
        }
        return acc;
      }, []) || [];
      
      return breakdown;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const quickStats = [
    {
      title: "Fees Awaiting Payment",
      value: `${feesData?.totalDue || 0}/${studentsCount || 0}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      progress: studentsCount ? ((feesData?.totalDue || 0) / studentsCount) * 100 : 0,
    },
    {
      title: "Student Present Today",
      value: `${todayAttendance?.present || 0}/${studentsCount || 0}`,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      progress: studentsCount ? ((todayAttendance?.present || 0) / studentsCount) * 100 : 0,
    },
    {
      title: "Total Teachers",
      value: teachersCount || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Absent Today",
      value: `${todayAttendance?.absent || 0}`,
      icon: ClipboardCheck,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  const incomeColors = ["hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--muted))", "hsl(var(--accent))"];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          {getGreeting()} ✨
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Here's what's happening at Holy Cross School today
        </p>
      </div>

      {/* Action Alerts */}
      <ActionAlerts />

      {/* Quick Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="text-xl md:text-2xl font-bold">{stat.value}</div>
              {stat.progress !== undefined && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stat.color.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min(stat.progress, 100)}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Fee Collection Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Fees Collection - Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyFees}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="collection" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incomeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={(entry) => entry.name}
                >
                  {incomeBreakdown?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={incomeColors[index % incomeColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{studentsCount || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold">₹{((feesData?.paid || 0) / 1000).toFixed(1)}k</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold">₹{((feesData?.pending || 0) / 1000).toFixed(1)}k</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold">{teachersCount || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Student Strength */}
      <ClassStrengthTable />
    </div>
  );
}
