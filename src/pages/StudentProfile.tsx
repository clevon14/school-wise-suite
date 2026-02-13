import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Phone, MapPin, Calendar, TrendingUp, DollarSign, Bus, ClipboardCheck } from "lucide-react";
import { format, subDays } from "date-fns";
import { Progress } from "@/components/ui/progress";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

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

  const { data: testResults } = useQuery({
    queryKey: ["student-tests-profile", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_results")
        .select("marks_obtained, test:tests(name, test_date, max_marks, subject:subjects(name))")
        .eq("student_id", id!)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!id,
  });

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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;
  }

  if (!student) {
    return <div className="flex items-center justify-center h-64"><p>Student not found</p></div>;
  }

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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">{attendance?.percentage || 0}%</p>
                <p className="text-sm text-muted-foreground">Attendance (30d)</p>
              </div>
            </div>
            <Progress value={attendance?.percentage || 0} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">₹{((fees?.totalDue || 0) / 1000).toFixed(1)}k</p>
                <p className="text-sm text-muted-foreground">Pending Fees</p>
              </div>
            </div>
            {(fees?.overdue || 0) > 0 && (
              <Badge variant="destructive" className="mt-2">{fees?.overdue} overdue</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{testResults?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Recent Tests</p>
              </div>
            </div>
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Personal Details */}
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

        {/* Attendance Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Attendance (Last 30 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{attendance?.total || 0}</p>
                <p className="text-xs text-muted-foreground">Total Days</p>
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

        {/* Recent Test Scores */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent Test Scores</CardTitle></CardHeader>
          <CardContent>
            {testResults && testResults.length > 0 ? (
              <div className="space-y-3">
                {testResults.map((result: any, i: number) => {
                  const pct = result.test?.max_marks ? Math.round((result.marks_obtained / result.test.max_marks) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{result.test?.name}</p>
                        <p className="text-sm text-muted-foreground">{result.test?.subject?.name} — {result.test?.test_date ? format(new Date(result.test.test_date), "MMM d") : ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{result.marks_obtained}/{result.test?.max_marks}</p>
                        <Badge variant={pct >= 75 ? "default" : pct >= 50 ? "secondary" : "destructive"}>
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No test results yet</p>
            )}
          </CardContent>
        </Card>

        {/* Fee Status */}
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
                {fees.records.filter((f: any) => f.status === "pending").slice(0, 5).map((f: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm p-2 border rounded">
                    <span>{f.fee_category?.name || "Fee"}</span>
                    <span className="font-medium">₹{Number(f.amount).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transport */}
        {transport && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Transport Assignment</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Route" value={`${transport.route?.route_name} (${transport.route?.route_number})`} />
              <InfoRow label="Bus" value={transport.route?.bus?.bus_number || "-"} />
              <InfoRow label="Stop" value={transport.stop?.stop_name || "-"} />
            </CardContent>
          </Card>
        )}
      </div>
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
