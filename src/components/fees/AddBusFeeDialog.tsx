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
import { Bus } from "lucide-react";

const busFeeSchema = z.object({
  route_id: z.string().min(1, "Route is required"),
  village: z.string().min(1, "Village name is required"),
  monthly_fee: z.string().min(1, "Monthly fee is required"),
});

type BusFeeFormValues = z.infer<typeof busFeeSchema>;

export function AddBusFeeDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BusFeeFormValues>({
    resolver: zodResolver(busFeeSchema),
    defaultValues: {
      route_id: "",
      village: "",
      monthly_fee: "",
    },
  });

  const { data: busRoutes } = useQuery({
    queryKey: ["busRoutes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_routes")
        .select("*, bus:buses(bus_number)")
        .order("route_number");
      if (error) throw error;
      return data;
    },
  });

  const updateBusRoute = useMutation({
    mutationFn: async (values: BusFeeFormValues) => {
      const { error } = await supabase
        .from("bus_routes")
        .update({
          village: values.village,
          monthly_fee: Number(values.monthly_fee),
        })
        .eq("id", values.route_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busRoutes"] });
      queryClient.invalidateQueries({ queryKey: ["busRoutesWithVillage"] });
      toast({
        title: "Success",
        description: "Bus fee added successfully",
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

  const onSubmit = (values: BusFeeFormValues) => {
    updateBusRoute.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Bus className="h-4 w-4 mr-2" />
          Add Bus Fee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Bus Fee for Route</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="route_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bus Route</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a route" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {busRoutes?.map((route: any) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.route_number} - {route.route_name} (Bus: {route.bus?.bus_number || "N/A"})
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
              name="village"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Village Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter village name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthly_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Bus Fee (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500" {...field} />
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
              <Button type="submit" disabled={updateBusRoute.isPending}>
                {updateBusRoute.isPending ? "Adding..." : "Add Bus Fee"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
