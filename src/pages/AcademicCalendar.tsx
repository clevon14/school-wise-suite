import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CalendarDays, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "holiday", label: "Holiday", color: "bg-destructive/20 text-destructive" },
  { value: "exam", label: "Exam Period", color: "bg-warning/20 text-warning" },
  { value: "ptm", label: "Parent-Teacher Meeting", color: "bg-info/20 text-info" },
  { value: "event", label: "School Event", color: "bg-primary/20 text-primary" },
  { value: "vacation", label: "Vacation", color: "bg-muted text-muted-foreground" },
];

export default function AcademicCalendar() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "holiday",
    start_date: "",
    end_date: "",
    description: "",
  });

  const monthStart = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

  const { data: events } = useQuery({
    queryKey: ["school-events", monthStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("school_events")
        .select("*")
        .lte("start_date", monthEnd)
        .gte("end_date", monthStart)
        .order("start_date");
      if (error) throw error;
      return data;
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("school_events").insert({
        title: newEvent.title,
        event_type: newEvent.event_type,
        start_date: newEvent.start_date,
        end_date: newEvent.end_date || newEvent.start_date,
        description: newEvent.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      queryClient.invalidateQueries({ queryKey: ["week-events"] });
      setAddDialogOpen(false);
      setNewEvent({ title: "", event_type: "holiday", start_date: "", end_date: "", description: "" });
      toast.success("Event added successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-events"] });
      queryClient.invalidateQueries({ queryKey: ["week-events"] });
      toast.success("Event deleted");
    },
  });

  const getEventTypeConfig = (type: string) =>
    EVENT_TYPES.find((t) => t.value === type) || EVENT_TYPES[3];

  // Get dates that have events for calendar highlighting
  const eventDates = events?.flatMap((e: any) => {
    const dates: Date[] = [];
    let current = parseISO(e.start_date);
    const end = parseISO(e.end_date);
    while (current <= end) {
      dates.push(new Date(current));
      current = new Date(current.setDate(current.getDate() + 1));
    }
    return dates;
  }) || [];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Academic Calendar</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage school holidays, events, and important dates
          </p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g., Republic Day Holiday"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select value={newEvent.event_type} onValueChange={(v) => setNewEvent({ ...newEvent, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date *</label>
                  <Input
                    type="date"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={newEvent.end_date}
                    onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Optional description..."
                />
              </div>
              <Button
                className="w-full"
                onClick={() => addEventMutation.mutate()}
                disabled={!newEvent.title || !newEvent.start_date || addEventMutation.isPending}
              >
                Add Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex justify-center">
            <Calendar
              mode="single"
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              modifiers={{ event: eventDates }}
              modifiersStyles={{
                event: { backgroundColor: "hsl(var(--primary) / 0.15)", fontWeight: "bold", borderRadius: "50%" },
              }}
            />
          </CardContent>
        </Card>

        {/* Events List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Events in {format(selectedMonth, "MMMM yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events && events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event: any) => {
                  const config = getEventTypeConfig(event.event_type);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={config.color}>{config.label}</Badge>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(event.start_date), "MMM d")}
                            {event.end_date !== event.start_date && ` — ${format(parseISO(event.end_date), "MMM d")}`}
                          </p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No events this month</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
