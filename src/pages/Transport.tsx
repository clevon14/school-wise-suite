import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bus, MapPin, Phone, Users, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { AddBusDialog } from "@/components/transport/AddBusDialog";
import { AddRouteDialog } from "@/components/transport/AddRouteDialog";
import { PassengerListDialog } from "@/components/transport/PassengerListDialog";
import { LiveBusTracking } from "@/components/transport/LiveBusTracking";
import { SimpleBusSetup } from "@/components/fees/SimpleBusSetup";
import { CollectBusFeeDialog } from "@/components/fees/CollectBusFeeDialog";
import { GenerateBusFeesDialog } from "@/components/fees/GenerateBusFeesDialog";
import { VillageBusFeesManager } from "@/components/fees/VillageBusFeesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Transport() {
  const [addBusOpen, setAddBusOpen] = useState(false);
  const [addRouteOpen, setAddRouteOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{ id: string; name: string } | null>(null);
  const [trackingRoute, setTrackingRoute] = useState<{ id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { data: buses, isLoading } = useQuery({
    queryKey: ["buses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buses")
        .select("*")
        .order("bus_number");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ["busRoutes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bus_routes")
        .select(`
          *,
          bus:buses(bus_number, driver_name, driver_phone)
        `)
        .order("route_number");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transport Management</h2>
          <p className="text-muted-foreground">Manage buses, routes, and student transportation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddRouteOpen(true)}>
            <MapPin className="h-4 w-4 mr-2" />
            Add Route
          </Button>
          <Button onClick={() => setAddBusOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bus
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-2 text-sm px-4 py-2">
            <Bus className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="bus-fees" className="flex items-center gap-2 text-sm px-4 py-2">
            <MapPin className="h-4 w-4" />
            Bus Fees
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Buses</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{buses?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {buses?.filter(b => b.status === 'active').length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Routes</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{routes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active routes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                <Bus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {buses?.reduce((sum, bus) => sum + (bus.capacity || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Seats available</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Buses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading buses...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bus Number</TableHead>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buses?.map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell className="font-medium">{bus.bus_number}</TableCell>
                        <TableCell>{bus.vehicle_number}</TableCell>
                        <TableCell>{bus.capacity} seats</TableCell>
                        <TableCell>{bus.driver_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {bus.driver_phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={bus.status === 'active' ? 'default' : 'secondary'}>
                            {bus.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bus Routes</CardTitle>
            </CardHeader>
            <CardContent>
              {routesLoading ? (
                <p>Loading routes...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Number</TableHead>
                      <TableHead>Route Name</TableHead>
                      <TableHead>Bus</TableHead>
                      <TableHead>Pickup Time</TableHead>
                      <TableHead>Drop Time</TableHead>
                      <TableHead>Monthly Fee</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes?.map((route: any) => (
                      <TableRow key={route.id}>
                        <TableCell className="font-medium">{route.route_number}</TableCell>
                        <TableCell>{route.route_name}</TableCell>
                        <TableCell>{route.bus?.bus_number || 'N/A'}</TableCell>
                        <TableCell>{route.pickup_time}</TableCell>
                        <TableCell>{route.drop_time}</TableCell>
                        <TableCell>₹{Number(route.monthly_fee).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRoute({ id: route.id, name: route.route_name })}
                              title="View Passengers"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTrackingRoute({ id: route.id, name: route.route_name })}
                              title="Track Bus"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Live Tracking */}
          {trackingRoute && (
            <LiveBusTracking routeId={trackingRoute.id} routeName={trackingRoute.name} />
          )}
        </TabsContent>

        <TabsContent value="bus-fees" className="space-y-6 mt-6">
          <SimpleBusSetup />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddBusDialog open={addBusOpen} onOpenChange={setAddBusOpen} />
      <AddRouteDialog open={addRouteOpen} onOpenChange={setAddRouteOpen} />
      {selectedRoute && (
        <PassengerListDialog
          routeId={selectedRoute.id}
          routeName={selectedRoute.name}
          open={!!selectedRoute}
          onOpenChange={(open) => !open && setSelectedRoute(null)}
        />
      )}
    </div>
  );
}
