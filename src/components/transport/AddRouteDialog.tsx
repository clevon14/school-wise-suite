import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AddRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRouteDialog({ open, onOpenChange }: AddRouteDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    route_number: "",
    route_name: "",
    bus_id: "",
    village: "",
    pickup_time: "",
    drop_time: "",
    monthly_fee: "",
  });

  // Fetch active buses
  const { data: buses } = useQuery({
    queryKey: ["buses-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .eq("status", "active")
        .order("bus_number");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const addRouteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bus_routes").insert({
        ...formData,
        monthly_fee: parseFloat(formData.monthly_fee),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busRoutes"] });
      toast.success("Route added successfully");
      onOpenChange(false);
      setFormData({
        route_number: "",
        route_name: "",
        bus_id: "",
        village: "",
        pickup_time: "",
        drop_time: "",
        monthly_fee: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to add route");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.route_number || !formData.route_name || !formData.bus_id || !formData.pickup_time || !formData.drop_time) {
      toast.error("Please fill in all required fields");
      return;
    }
    addRouteMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Route</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="route_number">Route Number *</Label>
              <Input
                id="route_number"
                value={formData.route_number}
                onChange={(e) => setFormData({ ...formData, route_number: e.target.value })}
                placeholder="R-01"
                required
              />
            </div>
            <div>
              <Label htmlFor="route_name">Route Name *</Label>
              <Input
                id="route_name"
                value={formData.route_name}
                onChange={(e) => setFormData({ ...formData, route_name: e.target.value })}
                placeholder="Main Street Route"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bus_id">Assign Bus *</Label>
            <Select value={formData.bus_id} onValueChange={(value) => setFormData({ ...formData, bus_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select bus" />
              </SelectTrigger>
              <SelectContent>
                {buses?.map((bus) => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.bus_number} - {bus.vehicle_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="village">Village/Area</Label>
            <Input
              id="village"
              value={formData.village}
              onChange={(e) => setFormData({ ...formData, village: e.target.value })}
              placeholder="Village name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickup_time">Pickup Time *</Label>
              <Input
                id="pickup_time"
                type="time"
                value={formData.pickup_time}
                onChange={(e) => setFormData({ ...formData, pickup_time: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="drop_time">Drop Time *</Label>
              <Input
                id="drop_time"
                type="time"
                value={formData.drop_time}
                onChange={(e) => setFormData({ ...formData, drop_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="monthly_fee">Monthly Fee (₹)</Label>
            <Input
              id="monthly_fee"
              type="number"
              min="0"
              value={formData.monthly_fee}
              onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
              placeholder="1000"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addRouteMutation.isPending}>
              {addRouteMutation.isPending ? "Adding..." : "Add Route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
