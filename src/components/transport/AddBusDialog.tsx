import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface AddBusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBusDialog({ open, onOpenChange }: AddBusDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    bus_number: "",
    vehicle_number: "",
    capacity: "",
    driver_name: "",
    driver_phone: "",
    conductor_name: "",
    conductor_phone: "",
    status: "active",
  });

  const addBusMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("buses").insert({
        ...formData,
        capacity: parseInt(formData.capacity),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast.success("Bus added successfully");
      onOpenChange(false);
      setFormData({
        bus_number: "",
        vehicle_number: "",
        capacity: "",
        driver_name: "",
        driver_phone: "",
        conductor_name: "",
        conductor_phone: "",
        status: "active",
      });
    },
    onError: (error) => {
      toast.error("Failed to add bus");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_number || !formData.vehicle_number || !formData.capacity || !formData.driver_name) {
      toast.error("Please fill in all required fields");
      return;
    }
    addBusMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bus_number">Bus Number *</Label>
              <Input
                id="bus_number"
                value={formData.bus_number}
                onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                placeholder="B-01"
                required
              />
            </div>
            <div>
              <Label htmlFor="vehicle_number">Vehicle Number *</Label>
              <Input
                id="vehicle_number"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                placeholder="KA-01-AB-1234"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="capacity">Capacity *</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="40"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="driver_name">Driver Name *</Label>
              <Input
                id="driver_name"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="driver_phone">Driver Phone *</Label>
              <Input
                id="driver_phone"
                type="tel"
                value={formData.driver_phone}
                onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conductor_name">Conductor Name</Label>
              <Input
                id="conductor_name"
                value={formData.conductor_name}
                onChange={(e) => setFormData({ ...formData, conductor_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="conductor_phone">Conductor Phone</Label>
              <Input
                id="conductor_phone"
                type="tel"
                value={formData.conductor_phone}
                onChange={(e) => setFormData({ ...formData, conductor_phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addBusMutation.isPending}>
              {addBusMutation.isPending ? "Adding..." : "Add Bus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
