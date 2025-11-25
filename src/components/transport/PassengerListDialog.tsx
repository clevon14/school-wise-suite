import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface PassengerListDialogProps {
  routeId: string;
  routeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PassengerListDialog({ routeId, routeName, open, onOpenChange }: PassengerListDialogProps) {
  // Fetch students on this route
  const { data: passengers, isLoading } = useQuery({
    queryKey: ["route-passengers", routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_transport")
        .select(`
          *,
          students:student_id(
            id,
            first_name,
            last_name,
            admission_number,
            parent_phone,
            classes:class_id(name, section)
          ),
          bus_stops:stop_id(
            stop_name,
            pickup_time
          )
        `)
        .eq("route_id", routeId)
        .eq("status", "active")
        .order("bus_stops(pickup_time)");

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const exportPassengerList = () => {
    if (!passengers || passengers.length === 0) {
      toast.error("No passengers to export");
      return;
    }

    const headers = ["S.No", "Admission No", "Student Name", "Class", "Stop", "Pickup Time", "Parent Contact"];
    const rows = passengers.map((p: any, index) => [
      index + 1,
      p.students?.admission_number || "",
      `${p.students?.first_name} ${p.students?.last_name}`,
      `${p.students?.classes?.name || ""} ${p.students?.classes?.section || ""}`.trim(),
      p.bus_stops?.stop_name || "",
      p.bus_stops?.pickup_time || "",
      p.students?.parent_phone || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${routeName.replace(/\s+/g, "_")}_passengers.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Passenger list exported");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Passenger List - {routeName}</DialogTitle>
            <Button variant="outline" size="sm" onClick={exportPassengerList}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto max-h-[70vh]">
          {isLoading ? (
            <div className="text-center py-8">Loading passengers...</div>
          ) : passengers && passengers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Stop</TableHead>
                  <TableHead>Pickup Time</TableHead>
                  <TableHead>Parent Contact</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passengers.map((passenger: any, index) => (
                  <TableRow key={passenger.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {passenger.students?.first_name} {passenger.students?.last_name}
                    </TableCell>
                    <TableCell>{passenger.students?.admission_number}</TableCell>
                    <TableCell>
                      {passenger.students?.classes?.name} {passenger.students?.classes?.section}
                    </TableCell>
                    <TableCell>{passenger.bus_stops?.stop_name}</TableCell>
                    <TableCell>{passenger.bus_stops?.pickup_time}</TableCell>
                    <TableCell>{passenger.students?.parent_phone}</TableCell>
                    <TableCell>
                      <Badge variant={passenger.status === "active" ? "default" : "secondary"}>
                        {passenger.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No passengers assigned to this route yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
