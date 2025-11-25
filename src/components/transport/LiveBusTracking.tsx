import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LiveBusTrackingProps {
  routeId: string;
  routeName: string;
}

export function LiveBusTracking({ routeId, routeName }: LiveBusTrackingProps) {
  const [gpsAvailable, setGpsAvailable] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    // Check if GPS/geolocation is available
    if ("geolocation" in navigator) {
      setGpsAvailable(true);
    }
  }, []);

  const startTracking = () => {
    if (!gpsAvailable) return;

    setTracking(true);
    
    // Get current position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        
        // Mock ETA calculation (in real implementation, use route calculation API)
        setEta("15 mins");
      },
      (error) => {
        console.error("GPS error:", error);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    // Watch position for live updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("GPS watch error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const stopTracking = () => {
    setTracking(false);
    setLocation(null);
    setEta(null);
  };

  if (!gpsAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Bus Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GPS tracking is not available on this device. Install the app on a GPS-enabled device to enable live tracking.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Live Bus Tracking - {routeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={tracking ? "default" : "secondary"}>
              {tracking ? "Tracking Active" : "Not Tracking"}
            </Badge>
            {tracking && location && (
              <span className="text-sm text-muted-foreground">
                <Navigation className="h-4 w-4 inline mr-1" />
                Live Location
              </span>
            )}
          </div>
          <Button
            variant={tracking ? "destructive" : "default"}
            size="sm"
            onClick={tracking ? stopTracking : startTracking}
          >
            {tracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>

        {tracking && location && (
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Current Location:</span>
              </div>
              <div className="text-xs text-muted-foreground ml-6">
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </div>
            </div>

            {eta && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Estimated Time of Arrival:</span>
                  <span className="font-bold text-primary">{eta}</span>
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Live tracking is active. Location updates every few seconds. For full map view with route visualization, 
                use the map feature.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!tracking && (
          <Alert>
            <AlertDescription className="text-sm">
              Click "Start Tracking" to enable live GPS tracking for this bus. Parents can view real-time location 
              and estimated arrival time.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
