import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";

export function SimpleBusSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVillage, setEditVillage] = useState("");
  const [editAmount, setEditAmount] = useState("");

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

  const updateRoute = useMutation({
    mutationFn: async ({ id, village, fee }: { id: string; village: string; fee: number }) => {
      const { error } = await supabase
        .from("bus_routes")
        .update({ village, monthly_fee: fee })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["busRoutes"] });
      toast({ title: "Success", description: "Bus fee updated" });
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (route: any) => {
    setEditingId(route.id);
    setEditVillage(route.village || "");
    setEditAmount(route.monthly_fee?.toString() || "0");
  };

  const handleSave = (id: string) => {
    updateRoute.mutate({ id, village: editVillage, fee: Number(editAmount) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Bus Fees (Village-wise)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {busRoutes?.map((route: any) => {
            const isEditing = editingId === route.id;

            return (
              <div
                key={route.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div>
                  <div className="font-medium">{route.route_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Route: {route.route_number} • Bus: {route.bus?.bus_number || "N/A"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <Input
                        value={editVillage}
                        onChange={(e) => setEditVillage(e.target.value)}
                        className="w-32"
                        placeholder="Village"
                      />
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-28"
                        placeholder="Fee"
                      />
                      <Button size="sm" onClick={() => handleSave(route.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {route.village || "No village"}
                        </div>
                        <div className="text-lg font-semibold">
                          ₹{Number(route.monthly_fee).toLocaleString()}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(route)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
