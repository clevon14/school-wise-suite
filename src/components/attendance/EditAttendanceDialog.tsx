import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const editAttendanceSchema = z.object({
  date: z.date({ required_error: "Please select a date" }),
  status: z.enum(["present", "absent", "late", "excused"], {
    required_error: "Please select a status",
  }),
  remarks: z.string().optional(),
});

type EditAttendanceFormValues = z.infer<typeof editAttendanceSchema>;

type AttendanceRecord = {
  id: string;
  date: string;
  status: string;
  remarks?: string;
  student?: {
    first_name: string;
    last_name: string;
  };
};

type EditAttendanceDialogProps = {
  record: AttendanceRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAttendanceDialog({
  record,
  open,
  onOpenChange,
}: EditAttendanceDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<EditAttendanceFormValues>({
    resolver: zodResolver(editAttendanceSchema),
    defaultValues: {
      date: record ? new Date(record.date) : new Date(),
      status: (record?.status as any) || "present",
      remarks: record?.remarks || "",
    },
  });

  // Update form when record changes
  useState(() => {
    if (record) {
      form.reset({
        date: new Date(record.date),
        status: record.status as any,
        remarks: record.remarks || "",
      });
    }
  });

  const updateAttendance = useMutation({
    mutationFn: async (values: EditAttendanceFormValues) => {
      if (!record) throw new Error("No record to update");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dateStr = format(values.date, "yyyy-MM-dd");
      const { error } = await supabase
        .from("attendance")
        .update({
          date: dateStr,
          status: values.status,
          remarks: values.remarks || null,
          marked_by: user.id,
        })
        .eq("id", record.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-report"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance"] });
      toast.success("Attendance updated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attendance");
    },
  });

  const onSubmit = (values: EditAttendanceFormValues) => {
    updateAttendance.mutate(values);
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogDescription>
            Update attendance for {record.student?.first_name}{" "}
            {record.student?.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("2020-01-01")
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional remarks"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateAttendance.isPending}>
                {updateAttendance.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
