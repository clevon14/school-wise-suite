import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserPlus } from "lucide-react";

const assignFeeSchema = z.object({
  fee_category_id: z.string().min(1, "Fee category is required"),
  assign_to: z.enum(["student", "class"]),
  student_id: z.string().optional(),
  class_id: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
}).refine((data) => {
  if (data.assign_to === "student") return !!data.student_id;
  if (data.assign_to === "class") return !!data.class_id;
  return false;
}, {
  message: "Please select a student or class",
  path: ["student_id"],
});

type AssignFeeFormValues = z.infer<typeof assignFeeSchema>;

export function AssignFeesDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AssignFeeFormValues>({
    resolver: zodResolver(assignFeeSchema),
    defaultValues: {
      assign_to: "student",
      due_date: new Date().toISOString().split("T")[0],
    },
  });

  const assignTo = form.watch("assign_to");

  const { data: feeCategories } = useQuery({
    queryKey: ["feeCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("status", "active")
        .order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: assignTo === "student",
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: assignTo === "class",
  });

  const assignFees = useMutation({
    mutationFn: async (values: AssignFeeFormValues) => {
      const feeCategory = feeCategories?.find(fc => fc.id === values.fee_category_id);
      if (!feeCategory) throw new Error("Fee category not found");

      if (values.assign_to === "student") {
        const { error } = await supabase
          .from("fee_assignments")
          .insert({
            student_id: values.student_id!,
            fee_category_id: values.fee_category_id,
            amount: feeCategory.amount,
            due_date: values.due_date,
            status: "pending",
          });
        if (error) throw error;
      } else {
        // Assign to all students in the class
        const { data: classStudents, error: studentsError } = await supabase
          .from("students")
          .select("id")
          .eq("class_id", values.class_id!)
          .eq("status", "active");

        if (studentsError) throw studentsError;

        if (classStudents && classStudents.length > 0) {
          const assignments = classStudents.map(student => ({
            student_id: student.id,
            fee_category_id: values.fee_category_id,
            amount: feeCategory.amount,
            due_date: values.due_date,
            status: "pending",
          }));

          const { error } = await supabase
            .from("fee_assignments")
            .insert(assignments);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["feeStats"] });
      toast({
        title: "Success",
        description: "Fees assigned successfully",
      });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AssignFeeFormValues) => {
    assignFees.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Fees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Fees</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fee_category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {feeCategories?.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} - ₹{Number(category.amount).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assign_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <label htmlFor="student">Individual Student</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="class" id="class" />
                        <label htmlFor="class">Entire Class</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {assignTo === "student" && (
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} ({student.admission_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {assignTo === "class" && (
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} {cls.section && `- ${cls.section}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignFees.isPending}>
                {assignFees.isPending ? "Assigning..." : "Assign Fees"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
