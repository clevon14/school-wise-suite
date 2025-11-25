import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Clock, Phone, Navigation } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ParentTransportView() {
  // Get current user
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Fetch student's transport details
  const { data: transportInfo, isLoading } = useQuery({
    queryKey: ["parent-transport", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select(`
          id,
          first_name,
          last_name,
          student_transport(
            *,
            bus_routes:route_id(
              route_name,
              route_number,
              pickup_time,
              drop_time,
              buses:bus_id(
                bus_number,
                vehicle_number,
                driver_name,
                driver_phone
              )
            ),
            bus_stops:stop_id(
              stop_name,
              pickup_time,
              drop_time,
              stop_address
            )
          )
        `)
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .single();

      if (studentError) throw studentError;
      return student;
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-8">Loading transport information...</div>
      </div>
    );
  }

  const transport = transportInfo?.student_transport?.[0];

  if (!transport) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">School Transport</h1>
        <Alert>
          <AlertDescription>
            No transport information available. Please contact the school office if your child uses school transport.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const route = transport.bus_routes as any;
  const stop = transport.bus_stops as any;
  const bus = route?.buses as any;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">School Transport</h1>
        <p className="text-muted-foreground mt-1">
          {transportInfo?.first_name} {transportInfo?.last_name}'s Bus Information
        </p>
      </div>

      {/* Bus and Route Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Bus Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Bus Number</div>
              <div className="font-semibold text-lg">{bus?.bus_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Vehicle Number</div>
              <div className="font-semibold">{bus?.vehicle_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Driver</div>
              <div className="font-semibold">{bus?.driver_name}</div>
              <div className="flex items-center gap-1 text-sm mt-1">
                <Phone className="h-3 w-3" />
                {bus?.driver_phone}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Route</div>
              <div className="font-semibold">
                {route?.route_number} - {route?.route_name}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Your Stop
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Stop Name</div>
              <div className="font-semibold text-lg">{stop?.stop_name}</div>
            </div>
            {stop?.stop_address && (
              <div>
                <div className="text-sm text-muted-foreground">Address</div>
                <div className="text-sm">{stop.stop_address}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Morning Pickup
                </div>
                <div className="font-semibold text-primary text-lg">
                  {stop?.pickup_time}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Evening Drop
                </div>
                <div className="font-semibold text-primary text-lg">
                  {stop?.drop_time}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Tracking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Bus Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Live GPS tracking will be available here when the bus driver starts tracking. 
              You'll be able to see the real-time location and estimated arrival time at your stop.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Expected Arrival</div>
            <div className="text-2xl font-bold text-primary">
              {stop?.pickup_time}
              <span className="text-sm font-normal text-muted-foreground ml-2">(Morning)</span>
            </div>
            <Badge variant="secondary" className="mt-2">
              Tracking Not Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Important Information */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Please ensure your child is at the stop 5 minutes before pickup time</p>
          <p>• In case of bus delays, you will be notified via SMS/WhatsApp</p>
          <p>• For any emergencies, contact the driver directly at {bus?.driver_phone}</p>
          <p>• Transport service status: <Badge variant="default" className="ml-2">{transport.status}</Badge></p>
        </CardContent>
      </Card>
    </div>
  );
}
