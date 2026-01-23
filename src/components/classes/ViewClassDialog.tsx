import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, BookOpen, Calendar } from "lucide-react";

interface ViewClassDialogProps {
  classId: string;
  className: string;
  section?: string | null;
  academicYear: string;
  children: React.ReactNode;
}

export function ViewClassDialog({
  classId,
  className,
  section,
  academicYear,
  children,
}: ViewClassDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["class-students", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, status")
        .eq("class_id", classId)
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: subjects } = useQuery({
    queryKey: ["class-subjects", classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_subjects")
        .select(`
          id,
          subjects(id, name, code),
          employees:teacher_id(id, first_name, last_name)
        `)
        .eq("class_id", classId);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {className} {section && `- ${section}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Info */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Academic Year:</span>
            <Badge variant="secondary">{academicYear}</Badge>
          </div>

          <Separator />

          {/* Students Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Students ({students?.length || 0})</h3>
            </div>
            {students && students.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <span className="text-sm">
                      {student.first_name} {student.last_name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {student.admission_number}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No students enrolled</p>
            )}
          </div>

          <Separator />

          {/* Subjects Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Subjects ({subjects?.length || 0})</h3>
            </div>
            {subjects && subjects.length > 0 ? (
              <div className="space-y-2">
                {subjects.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                  >
                    <div>
                      <span className="text-sm font-medium">
                        {(item.subjects as any)?.name || "Unknown"}
                      </span>
                      {(item.subjects as any)?.code && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({(item.subjects as any).code})
                        </span>
                      )}
                    </div>
                    {item.employees && (
                      <span className="text-xs text-muted-foreground">
                        {(item.employees as any).first_name} {(item.employees as any).last_name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No subjects assigned</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
