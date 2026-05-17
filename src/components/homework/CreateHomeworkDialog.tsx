import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  instructions: z.string().max(5000).optional().or(z.literal("")),
  class_id: z.string().uuid("Pick a class"),
  subject_id: z.string().uuid("Pick a subject"),
  due_date: z.string().min(1, "Due date is required"),
  max_marks: z.string().optional(),
});

interface Props {
  teacherEmployeeId: string;
  schoolId: string | null;
  editing?: any;
  trigger?: React.ReactNode;
}

export function CreateHomeworkDialog({ teacherEmployeeId, schoolId, editing, trigger }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    class_id: "",
    subject_id: "",
    due_date: "",
    max_marks: "",
    allow_late: true,
    status: "published" as "draft" | "published",
  });

  useEffect(() => {
    if (editing && open) {
      setForm({
        title: editing.title ?? "",
        instructions: editing.instructions ?? "",
        class_id: editing.class_id ?? "",
        subject_id: editing.subject_id ?? "",
        due_date: editing.due_date ? new Date(editing.due_date).toISOString().slice(0, 16) : "",
        max_marks: editing.max_marks?.toString() ?? "",
        allow_late: editing.allow_late ?? true,
        status: editing.status === "draft" ? "draft" : "published",
      });
    } else if (open) {
      setForm({
        title: "", instructions: "", class_id: "", subject_id: "",
        due_date: "", max_marks: "", allow_late: true, status: "published",
      });
    }
  }, [editing, open]);

  // Classes the teacher teaches
  const { data: teacherClasses } = useQuery({
    queryKey: ["teacher-class-subjects", teacherEmployeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select("class_id, subject_id, classes:class_id(id,name,section), subjects:subject_id(id,name)")
        .eq("teacher_id", teacherEmployeeId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!teacherEmployeeId && open,
  });

  const classOptions = Array.from(
    new Map((teacherClasses ?? []).map((r: any) => [r.class_id, r.classes])).entries()
  ).map(([id, c]: any) => ({ id, label: `${c?.name}${c?.section ? " - " + c.section : ""}` }));

  const subjectOptions = (teacherClasses ?? [])
    .filter((r: any) => r.class_id === form.class_id)
    .map((r: any) => ({ id: r.subject_id, label: r.subjects?.name }));

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0].message);
      }
      const payload = {
        title: form.title.trim(),
        instructions: form.instructions?.trim() || null,
        class_id: form.class_id,
        subject_id: form.subject_id,
        teacher_id: teacherEmployeeId,
        school_id: schoolId,
        due_date: new Date(form.due_date).toISOString(),
        max_marks: form.max_marks ? Number(form.max_marks) : null,
        allow_late: form.allow_late,
        status: form.status,
      };
      if (editing) {
        const { error } = await supabase.from("homework").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("homework").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Homework updated" : "Homework posted");
      qc.invalidateQueries({ queryKey: ["homework"] });
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button><Plus className="h-4 w-4 mr-2" />New Homework</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Homework" : "New Homework"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Class</Label>
              <Select value={form.class_id} onValueChange={(v) => setForm({ ...form, class_id: v, subject_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Pick class" /></SelectTrigger>
                <SelectContent>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })} disabled={!form.class_id}>
                <SelectTrigger><SelectValue placeholder="Pick subject" /></SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Instructions</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={5}
              maxLength={5000}
              placeholder="What should students do?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
              <Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <Label>Max marks (optional)</Label>
              <Input type="number" min="0" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <Label className="cursor-pointer">Allow late submissions</Label>
              <p className="text-xs text-muted-foreground">Students can submit after the due date.</p>
            </div>
            <Switch checked={form.allow_late} onCheckedChange={(v) => setForm({ ...form, allow_late: v })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (not visible to students)</SelectItem>
                <SelectItem value="published">Published (visible to students)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editing ? "Save changes" : "Post homework"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
