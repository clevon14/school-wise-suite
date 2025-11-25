import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

export function VillageBusFeesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: busRoutes, isLoading } = useQuery({
    queryKey: ["busRoutesWithVillage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_routes")
        .select("*, bus:buses(bus_number, vehicle_number)")
        .order("route_number");
      if (error) throw error;
      return data;
    },
  });

  const updateBusRoute = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("bus_routes")
        .update({
          village: data.village,
          monthly_fee: data.monthly_fee,
        })
        .eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busRoutesWithVillage"] });
      toast({
        title: "Success",
        description: "Bus fee updated successfully",
      });
      setEditingId(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (route: any) => {
    setEditingId(route.id);
    setFormData(route);
  };

  const handleSave = () => {
    updateBusRoute.mutate(formData);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Village-based Bus Fees</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Number</TableHead>
                <TableHead>Route Name</TableHead>
                <TableHead>Bus Number</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busRoutes?.map((route: any) => {
                const isEditing = editingId === route.id;

                return (
                  <TableRow key={route.id}>
                    <TableCell className="font-medium">{route.route_number}</TableCell>
                    <TableCell>{route.route_name}</TableCell>
                    <TableCell>{route.bus?.bus_number || "N/A"}</TableCell>
                    {isEditing ? (
                      <>
                        <TableCell>
                          <Input
                            value={formData.village || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, village: e.target.value })
                            }
                            placeholder="Enter village name"
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.monthly_fee || 0}
                            onChange={(e) =>
                              setFormData({ ...formData, monthly_fee: Number(e.target.value) })
                            }
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          {route.village || (
                            <span className="text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell>₹{Number(route.monthly_fee).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(route)}>
                            Edit
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
