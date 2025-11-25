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
import { GraduationCap } from "lucide-react";

const tuitionFeeSchema = z.object({
  class_id: z.string().min(1, "Class is required"),
  tuition_fee: z.string().min(1, "Tuition fee is required"),
  lab_fee: z.string().optional(),
  library_fee: z.string().optional(),
  sports_fee: z.string().optional(),
  other_fees: z.string().optional(),
});

type TuitionFeeFormValues = z.infer<typeof tuitionFeeSchema>;

export function AddTuitionFeeDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const form = useForm<TuitionFeeFormValues>({
    resolver: zodResolver(tuitionFeeSchema),
    defaultValues: {
      class_id: "",
      tuition_fee: "",
      lab_fee: "0",
      library_fee: "0",
      sports_fee: "0",
      other_fees: "0",
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createTuitionFee = useMutation({
    mutationFn: async (values: TuitionFeeFormValues) => {
      const { error } = await supabase
        .from("class_fee_structure")
        .upsert([{
          class_id: values.class_id,
          academic_year: academicYear,
          tuition_fee: Number(values.tuition_fee),
          lab_fee: Number(values.lab_fee || 0),
          library_fee: Number(values.library_fee || 0),
          sports_fee: Number(values.sports_fee || 0),
          other_fees: Number(values.other_fees || 0),
        }], {
          onConflict: 'class_id,academic_year'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classFeeStructures"] });
      toast({
        title: "Success",
        description: "Tuition fee structure added successfully",
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

  const onSubmit = (values: TuitionFeeFormValues) => {
    createTuitionFee.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <GraduationCap className="h-4 w-4 mr-2" />
          Add Tuition Fee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tuition Fee Structure ({academicYear})</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes?.map((cls: any) => (
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

            <FormField
              control={form.control}
              name="tuition_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tuition Fee (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lab_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lab Fee (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="library_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Library Fee (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sports_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sports Fee (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="other_fees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Fees (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTuitionFee.isPending}>
                {createTuitionFee.isPending ? "Adding..." : "Add Tuition Fee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
