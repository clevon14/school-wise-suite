import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserX, DollarSign, CalendarDays, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, subDays, addDays } from "date-fns";

export function ActionAlerts() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  // Students absent 3+ consecutive days
  const { data: consecutiveAbsences } = useQuery({
    queryKey: ["consecutive-absences"],
    queryFn: async () => {
      const threeDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd");
      const { data } = await supabase
        .from("attendance")
        .select("student_id, date, status, student:students(first_name, last_name, class:classes(name))")
        .eq("status", "absent")
        .gte("date", format(subDays(new Date(), 6), "yyyy-MM-dd"))
        .lte("date", today)
        .order("date", { ascending: false });

      if (!data) return [];

      // Group by student and count consecutive days
      const studentAbsences: Record<string, { count: number; student: any; dates: string[] }> = {};
      data.forEach((record: any) => {
        if (!studentAbsences[record.student_id]) {
          studentAbsences[record.student_id] = { count: 0, student: record.student, dates: [] };
        }
        studentAbsences[record.student_id].count++;
        studentAbsences[record.student_id].dates.push(record.date);
      });

      return Object.entries(studentAbsences)
        .filter(([_, v]) => v.count >= 3)
        .map(([id, v]) => ({ studentId: id, ...v }))
        .slice(0, 5);
    },
  });

  // Fees overdue by 30+ days
  const { data: overdueFees } = useQuery({
    queryKey: ["overdue-fees-alerts"],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data } = await supabase
        .from("fee_assignments")
        .select("id, amount, due_date, student:students(first_name, last_name, class:classes(name))")
        .eq("status", "pending")
        .lte("due_date", thirtyDaysAgo)
        .order("due_date")
        .limit(5);
      return data || [];
    },
  });

  // Upcoming exams/tests within 7 days
  const { data: upcomingTests } = useQuery({
    queryKey: ["upcoming-tests-alerts"],
    queryFn: async () => {
      const sevenDaysLater = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const { data } = await supabase
        .from("tests")
        .select("id, name, test_date, class:classes(name), subject:subjects(name)")
        .gte("test_date", today)
        .lte("test_date", sevenDaysLater)
        .order("test_date")
        .limit(5);
      return data || [];
    },
  });

  // Teachers absent today
  const { data: absentTeachers } = useQuery({
    queryKey: ["absent-teachers-today"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employee_attendance")
        .select("id, status, employee:employees(first_name, last_name, department)")
        .eq("date", today)
        .eq("status", "absent");
      return data || [];
    },
  });

  // Upcoming school events this week
  const { data: weekEvents } = useQuery({
    queryKey: ["week-events"],
    queryFn: async () => {
      const sevenDaysLater = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const { data } = await supabase
        .from("school_events")
        .select("*")
        .gte("end_date", today)
        .lte("start_date", sevenDaysLater)
        .order("start_date")
        .limit(5);
      return data || [];
    },
  });

  const totalAlerts = (consecutiveAbsences?.length || 0) + (overdueFees?.length || 0) + (absentTeachers?.length || 0);

  if (totalAlerts === 0 && !upcomingTests?.length && !weekEvents?.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="text-lg font-semibold">Today's Action Items</h3>
        {totalAlerts > 0 && (
          <Badge variant="destructive" className="ml-1">{totalAlerts}</Badge>
        )}
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Consecutive Absences */}
        {consecutiveAbsences && consecutiveAbsences.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserX className="h-4 w-4 text-destructive" />
                Repeated Absences
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {consecutiveAbsences.map((item: any) => (
                <div key={item.studentId} className="text-sm">
                  <span className="font-medium">{item.student?.first_name} {item.student?.last_name}</span>
                  <span className="text-muted-foreground"> — {item.count} days absent</span>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => navigate("/attendance")}>
                View Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Overdue Fees */}
        {overdueFees && overdueFees.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warning" />
                Overdue Fees (30+ days)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {overdueFees.map((item: any) => (
                <div key={item.id} className="text-sm">
                  <span className="font-medium">{item.student?.first_name} {item.student?.last_name}</span>
                  <span className="text-muted-foreground"> — ₹{Number(item.amount).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => navigate("/fees")}>
                Send Reminders
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Absent Teachers */}
        {absentTeachers && absentTeachers.length > 0 && (
          <Card className="border-info/50 bg-info/5">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-info" />
                Teachers Absent Today
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {absentTeachers.map((item: any) => (
                <div key={item.id} className="text-sm">
                  <span className="font-medium">{item.employee?.first_name} {item.employee?.last_name}</span>
                  {item.employee?.department && (
                    <span className="text-muted-foreground"> — {item.employee.department}</span>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => navigate("/teachers")}>
                View Staff
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Tests */}
        {upcomingTests && upcomingTests.length > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Upcoming Tests (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {upcomingTests.map((test: any) => (
                <div key={test.id} className="text-sm">
                  <span className="font-medium">{test.name}</span>
                  <span className="text-muted-foreground"> — {format(new Date(test.test_date), "MMM d")}</span>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => navigate("/tests")}>
                View Tests
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* This Week Calendar Strip */}
      {weekEvents && weekEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium">This Week's Events</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {weekEvents.map((event: any) => (
                <Badge key={event.id} variant="outline" className="py-1.5 px-3">
                  <CalendarDays className="h-3 w-3 mr-1.5" />
                  {event.title} — {format(new Date(event.start_date), "MMM d")}
                  {event.event_type === "holiday" && <span className="ml-1 text-destructive">(Holiday)</span>}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
