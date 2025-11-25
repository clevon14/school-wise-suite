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
  DialogDescription,
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
import { Bus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const busFeesSchema = z.object({
  due_date: z.string().min(1, "Due date is required"),
});

type BusFeesFormValues = z.infer<typeof busFeesSchema>;

export function GenerateBusFeesDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BusFeesFormValues>({
    resolver: zodResolver(busFeesSchema),
    defaultValues: {
      due_date: new Date().toISOString().split("T")[0],
    },
  });

  // Get count of students with active transport
  const { data: transportStats } = useQuery({
    queryKey: ["transportStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_transport")
        .select(`
          id,
          student:students(first_name, last_name),
          route:bus_routes(route_name, monthly_fee)
        `)
        .eq("status", "active");

      if (error) throw error;
      return {
        count: data?.length || 0,
        students: data,
      };
    },
    enabled: open,
  });

  const generateBusFees = useMutation({
    mutationFn: async (values: BusFeesFormValues) => {
      if (!transportStats?.students || transportStats.students.length === 0) {
        throw new Error("No students with active transport found");
      }

      // Get or create Bus Fee category
      let { data: feeCategory, error: categoryError } = await supabase
        .from("fee_categories")
        .select("id, amount")
        .eq("name", "Bus Fee")
        .eq("frequency", "monthly")
        .maybeSingle();

      if (categoryError) throw categoryError;

      // If no bus fee category exists, create one with a default amount
      if (!feeCategory) {
        const { data: newCategory, error: createError } = await supabase
          .from("fee_categories")
          .insert({
            name: "Bus Fee",
            description: "Monthly bus transportation fee",
            amount: 0, // Will be overridden by route-specific fees
            frequency: "monthly",
            academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
            is_mandatory: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        feeCategory = newCategory;
      }

      // Create fee assignments for each student with their route's fee
      const assignments = transportStats.students.map((transport: any) => ({
        student_id: transport.student_id,
        fee_category_id: feeCategory!.id,
        amount: transport.route?.monthly_fee || 0,
        due_date: values.due_date,
        status: "pending",
      }));

      const { error } = await supabase
        .from("fee_assignments")
        .insert(assignments);

      if (error) throw error;

      return assignments.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["feeAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["feeStats"] });
      toast({
        title: "Success",
        description: `Bus fees generated for ${count} students`,
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

  const onSubmit = (values: BusFeesFormValues) => {
    generateBusFees.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Bus className="h-4 w-4 mr-2" />
          Generate Bus Fees
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Bus Fees</DialogTitle>
          <DialogDescription>
            Create monthly bus fee assignments for all students with active transport
          </DialogDescription>
        </DialogHeader>

        {transportStats && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Students with transport:</span>
              <Badge variant="secondary">{transportStats.count}</Badge>
            </div>
            {transportStats.count === 0 && (
              <p className="text-sm text-destructive">
                No students with active transport assignments found
              </p>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button
                type="submit"
                disabled={
                  generateBusFees.isPending ||
                  !transportStats ||
                  transportStats.count === 0
                }
              >
                {generateBusFees.isPending
                  ? "Generating..."
                  : `Generate for ${transportStats?.count || 0} Students`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
