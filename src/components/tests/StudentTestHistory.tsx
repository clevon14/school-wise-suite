import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { calculateGrade, calculatePercentage } from "@/lib/grade-calculator";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface StudentTestHistoryProps {
  studentId: string;
}

export function StudentTestHistory({ studentId }: StudentTestHistoryProps) {
  // Fetch student test results
  const { data: testResults, isLoading } = useQuery({
    queryKey: ["student-test-history", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select(`
          *,
          tests:test_id(
            id,
            name,
            test_date,
            max_marks,
            pass_marks,
            subjects:subject_id(name)
          )
        `)
        .eq("student_id", studentId)
        .order("tests(test_date)", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading test history...</div>;
  }

  if (!testResults || testResults.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No test history available for this student.
        </div>
      </Card>
    );
  }

  // Calculate summary metrics
  const completedTests = testResults.filter((r) => !r.is_absent && r.marks_obtained !== null);
  const overallAvg = completedTests.length > 0
    ? completedTests.reduce((sum, r) => sum + (r.marks_obtained || 0), 0) / completedTests.length
    : 0;

  const last3Tests = completedTests.slice(0, 3);
  const last3Avg = last3Tests.length > 0
    ? last3Tests.reduce((sum, r) => sum + (r.marks_obtained || 0), 0) / last3Tests.length
    : 0;

  // Check for at-risk indicators
  const consecutiveFails = testResults.reduce((count, result, index) => {
    if (result.is_absent || result.marks_obtained === null) return count;
    const test = result.tests as any;
    if (result.marks_obtained < test.pass_marks) {
      return count + 1;
    }
    return 0;
  }, 0);

  const isAtRisk = consecutiveFails >= 2;

  // Calculate trend
  let trend = "stable";
  if (completedTests.length >= 2) {
    const recent = completedTests[0].marks_obtained || 0;
    const previous = completedTests[1].marks_obtained || 0;
    const diff = ((recent - previous) / previous) * 100;
    if (diff > 15) trend = "up";
    else if (diff < -15) trend = "down";
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Overall Average</div>
          <div className="text-2xl font-bold">{overallAvg.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {completedTests.length} tests completed
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Last 3 Tests Avg</div>
          <div className="text-2xl font-bold">{last3Avg.toFixed(1)}</div>
          <div className="flex items-center gap-2 mt-1">
            {trend === "up" && (
              <>
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-xs text-success">Improving</span>
              </>
            )}
            {trend === "down" && (
              <>
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-xs text-destructive">Declining</span>
              </>
            )}
            {trend === "stable" && (
              <span className="text-xs text-muted-foreground">Stable</span>
            )}
          </div>
        </Card>

        <Card className={`p-4 ${isAtRisk ? "border-destructive" : ""}`}>
          <div className="text-sm text-muted-foreground mb-1">Status</div>
          <div className="flex items-center gap-2">
            {isAtRisk ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-destructive">At Risk</span>
              </>
            ) : (
              <span className="font-semibold text-success">On Track</span>
            )}
          </div>
          {isAtRisk && (
            <div className="text-xs text-destructive mt-1">
              {consecutiveFails} consecutive fails
            </div>
          )}
        </Card>
      </div>

      {/* Test Timeline */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Test Timeline</h3>
        </div>
        <div className="divide-y">
          {testResults.map((result) => {
            const test = result.tests as any;
            const percentage = result.marks_obtained && !result.is_absent
              ? calculatePercentage(result.marks_obtained, test.max_marks)
              : 0;
            const grade = result.marks_obtained && !result.is_absent
              ? calculateGrade(result.marks_obtained, test.max_marks)
              : null;
            const passed = result.marks_obtained >= test.pass_marks;

            return (
              <div key={result.id} className="p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{test.name}</h4>
                      {result.is_absent ? (
                        <Badge variant="secondary">Absent</Badge>
                      ) : result.marks_obtained !== null ? (
                        <>
                          {grade && <Badge className={grade.color}>{grade.grade}</Badge>}
                          {!passed && <Badge variant="destructive">Failed</Badge>}
                        </>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {test.subjects?.name} • {format(new Date(test.test_date), "MMM dd, yyyy")}
                    </div>
                  </div>
                  {!result.is_absent && result.marks_obtained !== null && (
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {result.marks_obtained}/{test.max_marks}
                      </div>
                      <div className="text-sm text-muted-foreground">{percentage}%</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
