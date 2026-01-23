import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditClassDialogProps {
  classId: string;
  className: string;
  section?: string | null;
  academicYear: string;
  children: React.ReactNode;
}

export function EditClassDialog({
  classId,
  className,
  section,
  academicYear,
  children,
}: EditClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(className);
  const [sectionValue, setSectionValue] = useState(section || "");
  const [year, setYear] = useState(academicYear);
  const queryClient = useQueryClient();

  const updateClass = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("classes")
        .update({
          name,
          section: sectionValue || null,
          academic_year: year,
        })
        .eq("id", classId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class updated successfully");
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update class");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !year.trim()) {
      toast.error("Please fill in required fields");
      return;
    }
    updateClass.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Class 10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              value={sectionValue}
              onChange={(e) => setSectionValue(e.target.value)}
              placeholder="e.g., A, B, C"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Academic Year *</Label>
            <Input
              id="year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g., 2024-25"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateClass.isPending}>
              {updateClass.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
