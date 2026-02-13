import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

export function FeeDefaulters() {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: defaulters, isLoading } = useQuery({
    queryKey: ["fee-defaulters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          id, amount, due_date, status,
          student:students(id, first_name, last_name, admission_number, parent_phone, class:classes(name, section)),
          fee_category:fee_categories(name)
        `)
        .eq("status", "pending")
        .lt("due_date", today)
        .order("due_date");

      if (error) throw error;

      // Group by student
      const grouped: Record<string, { student: any; totalDue: number; oldestDue: string; fees: any[] }> = {};
      data?.forEach((fee: any) => {
        const sid = fee.student?.id;
        if (!sid) return;
        if (!grouped[sid]) {
          grouped[sid] = { student: fee.student, totalDue: 0, oldestDue: fee.due_date, fees: [] };
        }
        grouped[sid].totalDue += Number(fee.amount);
        grouped[sid].fees.push(fee);
        if (fee.due_date < grouped[sid].oldestDue) grouped[sid].oldestDue = fee.due_date;
      });

      return Object.values(grouped).sort((a, b) => a.oldestDue.localeCompare(b.oldestDue));
    },
  });

  const getAgeBadge = (dueDate: string) => {
    const days = differenceInDays(new Date(), new Date(dueDate));
    if (days >= 90) return <Badge variant="destructive">90+ days</Badge>;
    if (days >= 60) return <Badge className="bg-warning text-warning-foreground">60+ days</Badge>;
    return <Badge variant="secondary">30+ days</Badge>;
  };

  const exportDefaulters = () => {
    if (!defaulters?.length) return;
    const csv = [
      "Student Name,Admission No,Class,Phone,Total Due (₹),Oldest Due Date,Days Overdue",
      ...defaulters.map((d) => {
        const days = differenceInDays(new Date(), new Date(d.oldestDue));
        return `"${d.student.first_name} ${d.student.last_name}",${d.student.admission_number},"${d.student.class?.name || ""}",${d.student.parent_phone || ""},${d.totalDue},${d.oldestDue},${days}`;
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-defaulters-${today}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Fee Defaulters ({defaulters?.length || 0})
        </CardTitle>
        <Button variant="outline" size="sm" onClick={exportDefaulters} disabled={!defaulters?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : defaulters && defaulters.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Total Due (₹)</TableHead>
                  <TableHead>Pending Fees</TableHead>
                  <TableHead>Overdue Since</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaulters.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <button
                        className="text-primary hover:underline font-medium"
                        onClick={() => navigate(`/students/${d.student.id}`)}
                      >
                        {d.student.first_name} {d.student.last_name}
                      </button>
                      <p className="text-xs text-muted-foreground">{d.student.admission_number}</p>
                    </TableCell>
                    <TableCell>{d.student.class?.name} {d.student.class?.section || ""}</TableCell>
                    <TableCell>{d.student.parent_phone || "-"}</TableCell>
                    <TableCell className="text-right font-bold">₹{d.totalDue.toLocaleString("en-IN")}</TableCell>
                    <TableCell>{d.fees.length} fee(s)</TableCell>
                    <TableCell>{format(new Date(d.oldestDue), "dd MMM yyyy")}</TableCell>
                    <TableCell>{getAgeBadge(d.oldestDue)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => navigate("/fees")}>
                        Collect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No fee defaulters found — great!</p>
        )}
      </CardContent>
    </Card>
  );
}
