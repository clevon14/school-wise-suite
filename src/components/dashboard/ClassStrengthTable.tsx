import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

interface ClassStrength {
  className: string;
  boys: number;
  girls: number;
  other: number;
  total: number;
}

export function ClassStrengthTable() {
  const { data, isLoading } = useQuery({
    queryKey: ["class-strength"],
    queryFn: async () => {
      const { data: students } = await supabase
        .from("students")
        .select("gender, class:classes(name, section)")
        .eq("status", "active");

      if (!students) return { classes: [] as ClassStrength[], totals: { boys: 0, girls: 0, other: 0, total: 0 } };

      const grouped: Record<string, { boys: number; girls: number; other: number }> = {};

      students.forEach((s: any) => {
        const name = s.class?.name || "Unassigned";
        if (!grouped[name]) grouped[name] = { boys: 0, girls: 0, other: 0 };
        const g = (s.gender || "").toLowerCase();
        if (g === "male") grouped[name].boys++;
        else if (g === "female") grouped[name].girls++;
        else grouped[name].other++;
      });

      const classes = Object.entries(grouped)
        .map(([className, counts]) => ({
          className,
          ...counts,
          total: counts.boys + counts.girls + counts.other,
        }))
        .sort((a, b) => {
          const numA = parseInt(a.className.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.className.replace(/\D/g, "")) || 0;
          return numA - numB || a.className.localeCompare(b.className);
        });

      const totals = classes.reduce(
        (acc, c) => ({ boys: acc.boys + c.boys, girls: acc.girls + c.girls, other: acc.other + c.other, total: acc.total + c.total }),
        { boys: 0, girls: 0, other: 0, total: 0 }
      );

      return { classes, totals };
    },
  });

  if (isLoading) return null;

  const { classes = [], totals = { boys: 0, girls: 0, other: 0, total: 0 } } = data || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Class-wise Student Strength
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm pt-2">
          <span className="font-semibold">Total Enrolments: {totals.total}</span>
          <span className="text-muted-foreground">Boys: {totals.boys}</span>
          <span className="text-muted-foreground">Girls: {totals.girls}</span>
          {totals.other > 0 && <span className="text-muted-foreground">Other: {totals.other}</span>}
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="font-semibold text-primary">Class/Grade</TableHead>
                <TableHead className="text-center font-semibold text-primary">Boys</TableHead>
                <TableHead className="text-center font-semibold text-primary">Girls</TableHead>
                {totals.other > 0 && <TableHead className="text-center font-semibold text-primary">Other</TableHead>}
                <TableHead className="text-center font-semibold text-primary">Total Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.className}>
                  <TableCell className="font-medium">{c.className}</TableCell>
                  <TableCell className="text-center">{c.boys}</TableCell>
                  <TableCell className="text-center">{c.girls}</TableCell>
                  {totals.other > 0 && <TableCell className="text-center">{c.other}</TableCell>}
                  <TableCell className="text-center font-semibold">{c.total}</TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No students enrolled yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
