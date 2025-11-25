import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Timetable() {
  const { data: timetable, isLoading } = useQuery({
    queryKey: ["timetable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable")
        .select(`
          *,
          class:classes(name, section),
          subject:subjects(name, code),
          teacher:employees(first_name, last_name)
        `)
        .order("day_of_week")
        .order("start_time");
      
      if (error) throw error;
      return data;
    },
  });

  const groupedByDay = timetable?.reduce((acc: any, entry: any) => {
    const day = DAYS[entry.day_of_week];
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-muted-foreground">Manage class schedules and teacher assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Period
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Loading timetable...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Object.entries(groupedByDay).map(([day, periods]: [string, any]) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {day}
                  <Badge variant="secondary" className="ml-auto">{periods.length} periods</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {periods.map((period: any) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium min-w-[120px]">
                          {period.start_time} - {period.end_time}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">{period.subject?.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {period.class ? `${period.class.name} ${period.class.section || ''}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {period.teacher && (
                          <span className="text-sm text-muted-foreground">
                            {period.teacher.first_name} {period.teacher.last_name}
                          </span>
                        )}
                        {period.room_number && (
                          <Badge variant="outline">Room {period.room_number}</Badge>
                        )}
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
