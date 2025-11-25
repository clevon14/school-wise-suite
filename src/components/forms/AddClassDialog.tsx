import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const classSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(50),
  section: z.string().trim().max(10).optional(),
  academic_year: z.string().trim().min(1, "Academic year is required").max(20),
});

type ClassFormValues = z.infer<typeof classSchema>;

export function AddClassDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: "",
      section: "",
      academic_year: new Date().getFullYear().toString(),
    },
  });

  const createClass = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      const { data, error } = await supabase
        .from("classes")
        .insert([{
          name: values.name,
          academic_year: values.academic_year,
          section: values.section || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class added successfully");
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add class");
    },
  });

  const onSubmit = (values: ClassFormValues) => {
    createClass.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogDescription>
            Create a new class for the academic year
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Grade 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="section"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Section</FormLabel>
                  <FormControl>
                    <Input placeholder="A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academic_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <FormControl>
                    <Input placeholder="2024-2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createClass.isPending}>
                {createClass.isPending ? "Adding..." : "Add Class"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
