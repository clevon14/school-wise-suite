import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ClassData {
  id: string;
  name: string;
  section?: string;
}

interface SubjectData {
  id: string;
  name: string;
}

export function AddTeacherDialog({ open, onOpenChange }: AddTeacherDialogProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    classId: "",
    subjects: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");
      if (error) throw error;
      return data as ClassData[];
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as SubjectData[];
    },
  });

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the teacher's full name",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.username.trim() || !/^[a-zA-Z0-9]+$/.test(formData.username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters and numbers (no spaces or special characters)",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Please use at least 8 characters for security",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const email = `${formData.username.toLowerCase()}@school.com`;

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Update profile with teacher details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          username: formData.username.toLowerCase(),
          email,
          role: "teacher",
          class_id: formData.classId || null,
          subjects: formData.subjects.length > 0 ? formData.subjects : null,
          is_active: true,
        })
        .eq("id", authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "✓ Teacher Account Created",
        description: `Login: ${formData.username} — Password has been set`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher account",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      username: "",
      password: "",
      confirmPassword: "",
      classId: "",
      subjects: [],
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter((id) => id !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">Add New Teacher</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new teacher account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter teacher's full name"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value.toLowerCase() })
                }
                placeholder="Letters and numbers only"
                pattern="[a-zA-Z0-9]+"
                className="h-11"
                required
              />
              <p className="text-xs md:text-sm text-muted-foreground">
                Email will be: {formData.username || "username"}@school.com
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Re-enter password"
                  minLength={8}
                  className="h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classId">Assign Class (Optional)</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No class assigned</SelectItem>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                      {cls.section ? ` - ${cls.section}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Subjects (Optional)</Label>
              <div className="border rounded-lg p-3 md:p-4 space-y-2 max-h-48 overflow-y-auto">
                {subjects?.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-3 py-1">
                    <input
                      type="checkbox"
                      id={subject.id}
                      checked={formData.subjects.includes(subject.id)}
                      onChange={() => handleSubjectToggle(subject.id)}
                      className="rounded border-gray-300 h-4 w-4"
                    />
                    <label htmlFor={subject.id} className="text-sm cursor-pointer flex-1">
                      {subject.name}
                    </label>
                  </div>
                ))}
                {!subjects || subjects.length === 0 && (
                  <p className="text-sm text-muted-foreground">No subjects available yet</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isSubmitting}
              className="h-11 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full sm:w-auto">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Teacher Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
