import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useCurrentRole } from "@/lib/use-current-role";
import { CreateHomeworkDialog } from "@/components/homework/CreateHomeworkDialog";
import { SubmissionsTable } from "@/components/homework/SubmissionsTable";
import { StudentSubmissionForm } from "@/components/homework/StudentSubmissionForm";

export default function HomeworkDetail() {
  const { id } = useParams();
  const { data: me } = useCurrentRole();

  const { data: hw, isLoading } = useQuery({
    queryKey: ["homework-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("homework").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const [cls, subj, emp] = await Promise.all([
        supabase.from("classes").select("name,section").eq("id", data.class_id).maybeSingle(),
        supabase.from("subjects" as any).select("name").eq("id", data.subject_id).maybeSingle(),
        supabase.from("employees").select("first_name,last_name").eq("id", data.teacher_id).maybeSingle(),
      ]);
      return { ...data, classes: cls.data, subjects: subj.data, teacher: emp.data };
    },
    enabled: !!id,
  });

  // Find which child this homework is for (for parent/student view)
  const { data: childIds } = useQuery({
    queryKey: ["my-student-ids-for-hw", me?.userId, hw?.class_id],
    queryFn: async () => {
      if (!me?.userId || !hw?.class_id) return [];
      const { data } = await supabase
        .from("students").select("id, first_name, last_name, class_id")
        .eq("user_id", me.userId).eq("class_id", hw.class_id);
      return data || [];
    },
    enabled: !!me?.userId && !!hw?.class_id && me?.role !== "admin" && me?.role !== "teacher",
  });

  if (isLoading || !me) return <div className="p-6">Loading…</div>;
  if (!hw) return <div className="p-6">Homework not found or not accessible.</div>;

  const isStaff = me.role === "admin" || me.role === "teacher";
  const isOwner = me.role === "teacher" && hw.teacher_id === me.employeeId;
  const due = new Date(hw.due_date);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Link to="/homework"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-xl">{hw.title}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-2">
                <span>{hw.classes?.name}{hw.classes?.section ? ` - ${hw.classes.section}` : ""}</span>
                <span>•</span>
                <span>{hw.subjects?.name}</span>
                <span>•</span>
                <span><Calendar className="inline h-3 w-3 mr-1" />Due {format(due, "dd MMM yyyy, HH:mm")}</span>
                {hw.max_marks != null && (<><span>•</span><span>Max marks: {hw.max_marks}</span></>)}
                {hw.status === "draft" && <Badge variant="outline">Draft</Badge>}
              </div>
              {hw.teacher && (
                <p className="text-xs text-muted-foreground mt-1">Posted by {hw.teacher.first_name} {hw.teacher.last_name}</p>
              )}
            </div>
            {(isOwner || me.role === "admin") && (
              <CreateHomeworkDialog
                teacherEmployeeId={hw.teacher_id}
                schoolId={hw.school_id}
                editing={hw}
                trigger={<Button variant="outline" size="sm">Edit</Button>}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">
            {hw.instructions || <span className="text-muted-foreground">No instructions provided.</span>}
          </div>
        </CardContent>
      </Card>

      {isStaff ? (
        <Card>
          <CardHeader><CardTitle>Submissions</CardTitle></CardHeader>
          <CardContent>
            <SubmissionsTable
              homeworkId={hw.id}
              classId={hw.class_id}
              schoolId={hw.school_id}
              maxMarks={hw.max_marks}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {(childIds ?? []).length === 0 ? (
            <Card><CardContent className="p-6 text-muted-foreground">No matching student in your account for this class.</CardContent></Card>
          ) : (
            (childIds ?? []).map((c: any) => (
              <div key={c.id} className="space-y-2">
                {(childIds!.length > 1) && (
                  <p className="text-sm font-medium">{c.first_name} {c.last_name}</p>
                )}
                <StudentSubmissionForm homework={hw} studentId={c.id} />
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
