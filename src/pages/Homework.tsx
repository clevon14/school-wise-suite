import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, ArrowRight } from "lucide-react";
import { format, isPast } from "date-fns";
import { useCurrentRole } from "@/lib/use-current-role";
import { CreateHomeworkDialog } from "@/components/homework/CreateHomeworkDialog";

function HomeworkRow({ hw, statusLabel }: { hw: any; statusLabel?: string }) {
  const due = new Date(hw.due_date);
  const overdue = isPast(due);
  return (
    <Link to={`/homework/${hw.id}`}>
      <Card className="hover:bg-accent/40 transition-colors">
        <CardContent className="p-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{hw.title}</span>
              {hw.status === "draft" && <Badge variant="outline">Draft</Badge>}
              {statusLabel && (
                <Badge variant={
                  statusLabel === "Graded" ? "default"
                  : statusLabel === "Submitted" ? "secondary"
                  : statusLabel === "Late" ? "destructive"
                  : "outline"
                }>{statusLabel}</Badge>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
              <span>{hw.classes?.name}{hw.classes?.section ? ` - ${hw.classes.section}` : ""}</span>
              <span>•</span>
              <span>{hw.subjects?.name}</span>
              <span>•</span>
              <span className={overdue ? "text-destructive" : ""}>
                <Calendar className="inline h-3 w-3 mr-1" />
                Due {format(due, "dd MMM, HH:mm")}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function HomeworkPage() {
  const { data: me, isLoading: roleLoading } = useCurrentRole();
  const [tab, setTab] = useState("pending");

  const isStaff = me?.role === "admin" || me?.role === "teacher";

  // Staff view: list homework (teacher = own, admin = all)
  const { data: staffList } = useQuery({
    queryKey: ["homework", "staff", me?.role, me?.employeeId, me?.schoolId],
    queryFn: async () => {
      let q = supabase
        .from("homework")
        .select("*, classes:class_id(name,section), subjects:subject_id(name)")
        .order("due_date", { ascending: false });
      if (me?.role === "teacher" && me.employeeId) q = q.eq("teacher_id", me.employeeId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!me && isStaff,
  });

  // Student/parent view
  const { data: childIds } = useQuery({
    queryKey: ["my-student-ids", me?.userId],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("id, class_id").eq("user_id", me?.userId);
      return data || [];
    },
    enabled: !!me?.userId && !isStaff,
  });

  const classIds = useMemo(() => Array.from(new Set((childIds ?? []).map((c: any) => c.class_id).filter(Boolean))), [childIds]);

  const { data: studentHw } = useQuery({
    queryKey: ["homework", "student", classIds],
    queryFn: async () => {
      if (classIds.length === 0) return [];
      const { data, error } = await supabase
        .from("homework")
        .select("*, classes:class_id(name,section), subjects:subject_id(name)")
        .in("class_id", classIds)
        .eq("status", "published")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !isStaff && classIds.length > 0,
  });

  const { data: mySubs } = useQuery({
    queryKey: ["my-subs", (childIds ?? []).map((c: any) => c.id)],
    queryFn: async () => {
      const ids = (childIds ?? []).map((c: any) => c.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("homework_submissions").select("homework_id, student_id, status").in("student_id", ids);
      return data || [];
    },
    enabled: !isStaff && !!childIds && childIds.length > 0,
  });

  if (roleLoading || !me) {
    return <div className="p-6">Loading…</div>;
  }

  // ============= STAFF =============
  if (isStaff) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <ClipboardList className="h-6 w-6" /> Homework
            </h1>
            <p className="text-sm text-muted-foreground">Post assignments and track submissions.</p>
          </div>
          {me.role === "teacher" && me.employeeId && (
            <CreateHomeworkDialog teacherEmployeeId={me.employeeId} schoolId={me.schoolId} />
          )}
        </div>

        <div className="grid gap-3">
          {(staffList ?? []).map((hw: any) => <HomeworkRow key={hw.id} hw={hw} />)}
          {staffList && staffList.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              No homework yet. {me.role === "teacher" ? "Click ‘New Homework’ to post the first one." : ""}
            </CardContent></Card>
          )}
        </div>
      </div>
    );
  }

  // ============= STUDENT / PARENT =============
  const subMap = new Map<string, string>(); // homework_id -> status (last per child is fine)
  (mySubs ?? []).forEach((s: any) => subMap.set(s.homework_id, s.status));

  const enriched = (studentHw ?? []).map((hw: any) => {
    const status = subMap.get(hw.id);
    const overdue = isPast(new Date(hw.due_date));
    let bucket: "pending" | "submitted" | "graded";
    let label: string;
    if (status === "graded") { bucket = "graded"; label = "Graded"; }
    else if (status === "submitted" || status === "late") { bucket = "submitted"; label = status === "late" ? "Late" : "Submitted"; }
    else { bucket = "pending"; label = overdue ? "Overdue" : "Pending"; }
    return { hw, bucket, label };
  });

  const pending = enriched.filter(e => e.bucket === "pending");
  const submitted = enriched.filter(e => e.bucket === "submitted");
  const graded = enriched.filter(e => e.bucket === "graded");

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> Homework
        </h1>
        <p className="text-sm text-muted-foreground">Your assignments from teachers.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({submitted.length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({graded.length})</TabsTrigger>
        </TabsList>
        {[["pending", pending], ["submitted", submitted], ["graded", graded]].map(([key, list]: any) => (
          <TabsContent key={key} value={key} className="space-y-3 mt-4">
            {list.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nothing here yet.</CardContent></Card>
            ) : (
              list.map((e: any) => <HomeworkRow key={e.hw.id} hw={e.hw} statusLabel={e.label} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
