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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddBusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBusDialog({ open, onOpenChange }: AddBusDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    // Bus details
    bus_number: "",
    vehicle_number: "",
    capacity: "",
    status: "active",
    // Driver details
    driver_name: "",
    driver_phone: "",
    driver_license_number: "",
    driver_date_of_birth: "",
    driver_aadhar: "",
    driver_address: "",
    driver_salary: "",
    driver_bank_account: "",
    driver_ifsc: "",
    driver_bank_name: "",
    driver_bank_branch: "",
    // Conductor details
    conductor_name: "",
    conductor_phone: "",
    conductor_license_number: "",
    conductor_date_of_birth: "",
    conductor_aadhar: "",
    conductor_address: "",
    conductor_salary: "",
    conductor_bank_account: "",
    conductor_ifsc: "",
    conductor_bank_name: "",
    conductor_bank_branch: "",
  });

  const update = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));

  const addBusMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("buses").insert({
        bus_number: formData.bus_number,
        vehicle_number: formData.vehicle_number,
        capacity: parseInt(formData.capacity),
        status: formData.status,
        driver_name: formData.driver_name,
        driver_phone: formData.driver_phone,
        driver_license_number: formData.driver_license_number || null,
        driver_date_of_birth: formData.driver_date_of_birth || null,
        driver_aadhar: formData.driver_aadhar || null,
        driver_address: formData.driver_address || null,
        driver_salary: formData.driver_salary ? parseFloat(formData.driver_salary) : null,
        driver_bank_account: formData.driver_bank_account || null,
        driver_ifsc: formData.driver_ifsc || null,
        driver_bank_name: formData.driver_bank_name || null,
        driver_bank_branch: formData.driver_bank_branch || null,
        conductor_name: formData.conductor_name || null,
        conductor_phone: formData.conductor_phone || null,
        conductor_license_number: formData.conductor_license_number || null,
        conductor_date_of_birth: formData.conductor_date_of_birth || null,
        conductor_aadhar: formData.conductor_aadhar || null,
        conductor_address: formData.conductor_address || null,
        conductor_salary: formData.conductor_salary ? parseFloat(formData.conductor_salary) : null,
        conductor_bank_account: formData.conductor_bank_account || null,
        conductor_ifsc: formData.conductor_ifsc || null,
        conductor_bank_name: formData.conductor_bank_name || null,
        conductor_bank_branch: formData.conductor_bank_branch || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
      toast.success("Bus added successfully");
      onOpenChange(false);
      setFormData({
        bus_number: "", vehicle_number: "", capacity: "", status: "active",
        driver_name: "", driver_phone: "", driver_license_number: "", driver_date_of_birth: "",
        driver_aadhar: "", driver_address: "", driver_salary: "",
        driver_bank_account: "", driver_ifsc: "", driver_bank_name: "", driver_bank_branch: "",
        conductor_name: "", conductor_phone: "", conductor_license_number: "", conductor_date_of_birth: "",
        conductor_aadhar: "", conductor_address: "", conductor_salary: "",
        conductor_bank_account: "", conductor_ifsc: "", conductor_bank_name: "", conductor_bank_branch: "",
      });
    },
    onError: (error) => {
      toast.error("Failed to add bus");
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bus_number || !formData.vehicle_number || !formData.capacity || !formData.driver_name || !formData.driver_phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    addBusMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Bus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bus Information */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-semibold">Bus Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bus_number">Bus Number *</Label>
                <Input id="bus_number" value={formData.bus_number} onChange={(e) => update("bus_number", e.target.value)} placeholder="B-01" required />
              </div>
              <div>
                <Label htmlFor="vehicle_number">Vehicle Number *</Label>
                <Input id="vehicle_number" value={formData.vehicle_number} onChange={(e) => update("vehicle_number", e.target.value)} placeholder="KA-01-AB-1234" required />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input id="capacity" type="number" min="1" value={formData.capacity} onChange={(e) => update("capacity", e.target.value)} placeholder="40" required />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => update("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Driver Details */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-semibold">Driver Details</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="driver_name">Driver Name *</Label>
                <Input id="driver_name" value={formData.driver_name} onChange={(e) => update("driver_name", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="driver_phone">Phone *</Label>
                <Input id="driver_phone" type="tel" value={formData.driver_phone} onChange={(e) => update("driver_phone", e.target.value)} placeholder="9876543210" required />
              </div>
              <div>
                <Label htmlFor="driver_license_number">License Number</Label>
                <Input id="driver_license_number" value={formData.driver_license_number} onChange={(e) => update("driver_license_number", e.target.value)} placeholder="DL-XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="driver_date_of_birth">Date of Birth</Label>
                <Input id="driver_date_of_birth" type="date" value={formData.driver_date_of_birth} onChange={(e) => update("driver_date_of_birth", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="driver_aadhar">Aadhar Number</Label>
                <Input id="driver_aadhar" value={formData.driver_aadhar} onChange={(e) => update("driver_aadhar", e.target.value)} placeholder="XXXX-XXXX-XXXX" />
              </div>
              <div>
                <Label htmlFor="driver_salary">Salary</Label>
                <Input id="driver_salary" type="number" value={formData.driver_salary} onChange={(e) => update("driver_salary", e.target.value)} placeholder="Enter amount" />
              </div>
              <div>
                <Label htmlFor="driver_address">Address</Label>
                <Input id="driver_address" value={formData.driver_address} onChange={(e) => update("driver_address", e.target.value)} placeholder="Enter address" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="driver_bank_account">Bank Account Number</Label>
                <Input id="driver_bank_account" value={formData.driver_bank_account} onChange={(e) => update("driver_bank_account", e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <Label htmlFor="driver_ifsc">IFSC Code</Label>
                <Input id="driver_ifsc" value={formData.driver_ifsc} onChange={(e) => update("driver_ifsc", e.target.value)} placeholder="SBIN0XXXXXX" />
              </div>
              <div>
                <Label htmlFor="driver_bank_name">Bank Name</Label>
                <Input id="driver_bank_name" value={formData.driver_bank_name} onChange={(e) => update("driver_bank_name", e.target.value)} placeholder="Bank name" />
              </div>
              <div>
                <Label htmlFor="driver_bank_branch">Bank Branch</Label>
                <Input id="driver_bank_branch" value={formData.driver_bank_branch} onChange={(e) => update("driver_bank_branch", e.target.value)} placeholder="Branch name" />
              </div>
            </div>
          </div>

          {/* Conductor Details */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <h3 className="text-lg font-semibold">Conductor Details</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="conductor_name">Conductor Name</Label>
                <Input id="conductor_name" value={formData.conductor_name} onChange={(e) => update("conductor_name", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="conductor_phone">Phone</Label>
                <Input id="conductor_phone" type="tel" value={formData.conductor_phone} onChange={(e) => update("conductor_phone", e.target.value)} placeholder="9876543210" />
              </div>
              <div>
                <Label htmlFor="conductor_license_number">License Number</Label>
                <Input id="conductor_license_number" value={formData.conductor_license_number} onChange={(e) => update("conductor_license_number", e.target.value)} placeholder="DL-XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="conductor_date_of_birth">Date of Birth</Label>
                <Input id="conductor_date_of_birth" type="date" value={formData.conductor_date_of_birth} onChange={(e) => update("conductor_date_of_birth", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="conductor_aadhar">Aadhar Number</Label>
                <Input id="conductor_aadhar" value={formData.conductor_aadhar} onChange={(e) => update("conductor_aadhar", e.target.value)} placeholder="XXXX-XXXX-XXXX" />
              </div>
              <div>
                <Label htmlFor="conductor_salary">Salary</Label>
                <Input id="conductor_salary" type="number" value={formData.conductor_salary} onChange={(e) => update("conductor_salary", e.target.value)} placeholder="Enter amount" />
              </div>
              <div>
                <Label htmlFor="conductor_address">Address</Label>
                <Input id="conductor_address" value={formData.conductor_address} onChange={(e) => update("conductor_address", e.target.value)} placeholder="Enter address" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="conductor_bank_account">Bank Account Number</Label>
                <Input id="conductor_bank_account" value={formData.conductor_bank_account} onChange={(e) => update("conductor_bank_account", e.target.value)} placeholder="Account number" />
              </div>
              <div>
                <Label htmlFor="conductor_ifsc">IFSC Code</Label>
                <Input id="conductor_ifsc" value={formData.conductor_ifsc} onChange={(e) => update("conductor_ifsc", e.target.value)} placeholder="SBIN0XXXXXX" />
              </div>
              <div>
                <Label htmlFor="conductor_bank_name">Bank Name</Label>
                <Input id="conductor_bank_name" value={formData.conductor_bank_name} onChange={(e) => update("conductor_bank_name", e.target.value)} placeholder="Bank name" />
              </div>
              <div>
                <Label htmlFor="conductor_bank_branch">Bank Branch</Label>
                <Input id="conductor_bank_branch" value={formData.conductor_bank_branch} onChange={(e) => update("conductor_bank_branch", e.target.value)} placeholder="Branch name" />
              </div>
            </div>
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
