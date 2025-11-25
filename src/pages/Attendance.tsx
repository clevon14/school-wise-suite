import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";

export default function Attendance() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
        <p className="text-muted-foreground">Track daily attendance for students and staff</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mark Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full" variant="outline">
                Mark Student Attendance
              </Button>
              <Button className="w-full" variant="outline">
                Mark Staff Attendance
              </Button>
              <Button className="w-full" variant="outline">
                View Attendance Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
