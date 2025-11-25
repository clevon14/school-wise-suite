import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ClassTestHistoryProps {
  classId: string;
  subjectId?: string;
}

export function ClassTestHistory({ classId, subjectId }: ClassTestHistoryProps) {
  // Fetch test history for the class
  const { data: testHistory, isLoading } = useQuery({
    queryKey: ["class-test-history", classId, subjectId],
    queryFn: async () => {
      let query = supabase
        .from("test_statistics")
        .select("*")
        .eq("class_id", classId)
        .order("test_date", { ascending: true });

      if (subjectId) {
        query = query.eq("subject_id", subjectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading test history...</div>;
  }

  if (!testHistory || testHistory.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No test history available for this class.
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = testHistory.map((test) => ({
    name: test.test_name,
    date: format(new Date(test.test_date), "MMM dd"),
    avgScore: test.avg_score ? Number(test.avg_score) : 0,
    passRate: test.pass_percentage || 0,
  }));

  // Calculate trends
  const testsWithTrends = testHistory.map((test, index) => {
    let trend = "stable";
    let trendValue = 0;
    
    if (index > 0 && test.avg_score && testHistory[index - 1].avg_score) {
      const diff = Number(test.avg_score) - Number(testHistory[index - 1].avg_score);
      trendValue = diff;
      if (diff > 2) trend = "up";
      else if (diff < -2) trend = "down";
    }

    return { ...test, trend, trendValue };
  });

  return (
    <div className="space-y-6">
      {/* Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="avgScore"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Average Score"
            />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              name="Pass Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Test History Table */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Test History</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Pass Rate</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testsWithTrends.map((test) => (
                <TableRow key={test.test_id}>
                  <TableCell className="font-medium">{test.test_name}</TableCell>
                  <TableCell>{format(new Date(test.test_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    {test.avg_score ? `${test.avg_score}/${test.max_marks}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {test.pass_percentage !== null ? `${test.pass_percentage}%` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {test.present_count}/{test.total_students}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {test.trend === "up" && (
                        <>
                          <TrendingUp className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">+{test.trendValue.toFixed(1)}</span>
                        </>
                      )}
                      {test.trend === "down" && (
                        <>
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">{test.trendValue.toFixed(1)}</span>
                        </>
                      )}
                      {test.trend === "stable" && (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Stable</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
