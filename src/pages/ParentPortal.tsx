import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, GraduationCap, DollarSign, Bus, Bell } from "lucide-react";

export default function ParentPortal() {
  const { data: children } = useQuery({
    queryKey: ["parent-children"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data } = await supabase
        .from("students")
        .select(`
          *,
          class:classes(name, section)
        `)
        .eq("user_id", user.id);
      
      return data || [];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["parent-attendance"],
    queryFn: async () => {
      if (!children || children.length === 0) return [];
      
      const studentIds = children.map(c => c.id);
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .in("student_id", studentIds)
        .order("date", { ascending: false })
        .limit(30);
      
      return data || [];
    },
    enabled: !!children && children.length > 0,
  });

  const { data: fees } = useQuery({
    queryKey: ["parent-fees"],
    queryFn: async () => {
      if (!children || children.length === 0) return [];
      
      const studentIds = children.map(c => c.id);
      const { data } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          fee_category:fee_categories(name, amount),
          payments(amount, payment_date)
        `)
        .in("student_id", studentIds);
      
      return data || [];
    },
    enabled: !!children && children.length > 0,
  });

  const { data: transport } = useQuery({
    queryKey: ["parent-transport"],
    queryFn: async () => {
      if (!children || children.length === 0) return [];
      
      const studentIds = children.map(c => c.id);
      const { data } = await supabase
        .from("student_transport")
        .select(`
          *,
          route:bus_routes(route_name, route_number, pickup_time, drop_time),
          stop:bus_stops(stop_name, pickup_time, drop_time)
        `)
        .in("student_id", studentIds)
        .eq("status", "active");
      
      return data || [];
    },
    enabled: !!children && children.length > 0,
  });

  const calculateAttendancePercentage = (studentId: string) => {
    if (!attendance) return 0;
    const studentAttendance = attendance.filter(a => a.student_id === studentId);
    if (studentAttendance.length === 0) return 0;
    const present = studentAttendance.filter(a => a.status === "present").length;
    return Math.round((present / studentAttendance.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Parent Portal</h2>
        <p className="text-muted-foreground">Monitor your child's progress and school activities</p>
      </div>

      {children && children.length > 0 ? (
        <Tabs defaultValue={children[0].id} className="space-y-4">
          <TabsList>
            {children.map((child: any) => (
              <TabsTrigger key={child.id} value={child.id}>
                {child.first_name} {child.last_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {children.map((child: any) => (
            <TabsContent key={child.id} value={child.id} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Class</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {child.class ? `${child.class.name} ${child.class.section || ''}` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{calculateAttendancePercentage(child.id)}%</div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fee Status</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {fees?.filter(f => f.student_id === child.id && f.status === "pending").length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Pending payments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Transport</CardTitle>
                    <Bus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {transport?.find(t => t.student_id === child.id) ? 'Active' : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Attendance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {attendance
                        ?.filter(a => a.student_id === child.id)
                        .slice(0, 5)
                        .map((record: any) => (
                          <div key={record.id} className="flex items-center justify-between">
                            <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                            <Badge variant={record.status === "present" ? "default" : "destructive"}>
                              {record.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fee Payments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {fees
                        ?.filter(f => f.student_id === child.id)
                        .slice(0, 5)
                        .map((fee: any) => (
                          <div key={fee.id} className="flex items-center justify-between">
                            <span className="text-sm">{fee.fee_category?.name}</span>
                            <Badge variant={fee.status === "paid" ? "default" : "secondary"}>
                              ${fee.amount}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {transport?.find(t => t.student_id === child.id) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Transport Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transport
                      .filter(t => t.student_id === child.id)
                      .map((t: any) => (
                        <div key={t.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Route:</span>
                            <span className="text-sm">{t.route?.route_name} ({t.route?.route_number})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Stop:</span>
                            <span className="text-sm">{t.stop?.stop_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Pickup:</span>
                            <span className="text-sm">{t.stop?.pickup_time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Drop:</span>
                            <span className="text-sm">{t.stop?.drop_time}</span>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No student records found. Please contact the school administration.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
