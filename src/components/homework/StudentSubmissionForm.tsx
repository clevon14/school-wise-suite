import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  homework: any;
  studentId: string;
}

export function StudentSubmissionForm({ homework, studentId }: Props) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: submission } = useQuery({
    queryKey: ["my-submission", homework.id, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homework_submissions")
        .select("*")
        .eq("homework_id", homework.id)
        .eq("student_id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (submission?.submission_text) setText(submission.submission_text);
  }, [submission]);

  const isGraded = submission?.status === "graded";
  const now = new Date();
  const due = new Date(homework.due_date);
  const isPastDue = now > due;
  const locked = isGraded || (isPastDue && !homework.allow_late);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!text.trim()) throw new Error("Please enter your submission text");
      const payload: any = {
        homework_id: homework.id,
        student_id: studentId,
        school_id: homework.school_id,
        submission_text: text.trim(),
        submitted_at: new Date().toISOString(),
      };
      if (submission?.id) {
        const { error } = await supabase.from("homework_submissions")
          .update(payload).eq("id", submission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("homework_submissions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Submitted");
      qc.invalidateQueries({ queryKey: ["my-submission", homework.id, studentId] });
      qc.invalidateQueries({ queryKey: ["homework"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Submission</span>
          {submission && (
            <Badge variant={
              submission.status === "graded" ? "default"
              : submission.status === "late" ? "destructive"
              : submission.status === "submitted" ? "secondary"
              : "outline"
            }>{submission.status.replace("_", " ")}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isGraded && (
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="font-medium">
              Grade: {submission.marks_awarded ?? "—"}{homework.max_marks ? ` / ${homework.max_marks}` : ""}
            </div>
            {submission.feedback && (
              <div className="text-sm mt-1 whitespace-pre-wrap">
                <span className="text-muted-foreground">Feedback: </span>{submission.feedback}
              </div>
            )}
          </div>
        )}
        <div>
          <Label>Answer</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Type your answer here…"
            disabled={locked}
            maxLength={10000}
          />
        </div>
        {submission?.submitted_at && (
          <p className="text-xs text-muted-foreground">
            Last submitted: {format(new Date(submission.submitted_at), "dd MMM yyyy, HH:mm")}
          </p>
        )}
        {locked ? (
          <p className="text-sm text-muted-foreground">
            {isGraded ? "This homework has been graded — no more changes." : "Submissions are closed for this homework."}
          </p>
        ) : (
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {submission?.submitted_at ? "Resubmit" : "Submit"}
          </Button>
        )}
        {isPastDue && !isGraded && (
          <p className="text-xs text-destructive">
            Past due ({format(due, "dd MMM yyyy, HH:mm")}){homework.allow_late ? " — late submissions accepted." : "."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
