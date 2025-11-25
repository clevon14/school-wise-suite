import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { calculateGrade, calculatePercentage } from "@/lib/grade-calculator";
import { exportTestResultsToCSV } from "@/lib/test-csv-export";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function TestDetails() {
  const { testId } = useParams();
  const queryClient = useQueryClient();
  const [editingScores, setEditingScores] = useState<Record<string, number | null>>({});

  // Fetch test details
  const { data: test } = useQuery({
    queryKey: ["test", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select(`
          *,
          classes:class_id(name, section),
          subjects:subject_id(name)
        `)
        .eq("id", testId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch test statistics
  const { data: stats } = useQuery({
    queryKey: ["test-stats", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_statistics")
        .select("*")
        .eq("test_id", testId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch test results with student info
  const { data: results, isLoading } = useQuery({
    queryKey: ["test-results", testId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("test_results")
        .select(`
          *,
          students:student_id(
            id,
            first_name,
            last_name,
            admission_number
          )
        `)
        .eq("test_id", testId)
        .order("students(first_name)");
      if (error) throw error;
      return data;
    },
  });

  // Update result mutation
  const updateResultMutation = useMutation({
    mutationFn: async ({ resultId, marks, isAbsent }: { resultId: string; marks: number | null; isAbsent: boolean }) => {
      const { error } = await supabase
        .from("test_results")
        .update({
          marks_obtained: isAbsent ? null : marks,
          is_absent: isAbsent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resultId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-results", testId] });
      queryClient.invalidateQueries({ queryKey: ["test-stats", testId] });
      toast.success("Score updated successfully");
      setEditingScores({});
    },
    onError: (error) => {
      toast.error("Failed to update score");
      console.error(error);
    },
  });

  const handleScoreChange = (resultId: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setEditingScores(prev => ({ ...prev, [resultId]: numValue }));
  };

  const handleSaveScore = (resultId: string, isAbsent: boolean) => {
    const marks = editingScores[resultId];
    updateResultMutation.mutate({ resultId, marks, isAbsent });
  };

  const handleExportCSV = () => {
    if (test && results) {
      exportTestResultsToCSV(test, results);
    }
  };

  if (!test || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading test details...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to="/tests">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{test.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{test.classes?.name} {test.classes?.section && `(${test.classes.section})`}</span>
              <span>•</span>
              <span>{test.subjects?.name}</span>
              <span>•</span>
              <span>{format(new Date(test.test_date), "MMMM dd, yyyy")}</span>
            </div>
          </div>
        </div>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Average Score</div>
          <div className="text-2xl font-bold">
            {stats.avg_score ? `${stats.avg_score}/${test.max_marks}` : "-"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.avg_score ? `${((stats.avg_score / test.max_marks) * 100).toFixed(1)}%` : ""}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Highest Score</div>
          <div className="text-2xl font-bold text-success">
            {stats.highest_score !== null ? stats.highest_score : "-"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Lowest Score</div>
          <div className="text-2xl font-bold text-destructive">
            {stats.lowest_score !== null ? stats.lowest_score : "-"}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Pass Rate</div>
          <div className="text-2xl font-bold">
            {stats.pass_percentage !== null ? `${stats.pass_percentage}%` : "-"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {stats.pass_count}/{stats.present_count} students
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Absentees</div>
          <div className="text-2xl font-bold text-warning">
            {stats.absent_count}
          </div>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Student Results</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Percent</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading results...
                  </TableCell>
                </TableRow>
              ) : results && results.length > 0 ? (
                results.map((result: any) => {
                  const student = result.students;
                  const percentage = result.marks_obtained && !result.is_absent 
                    ? calculatePercentage(result.marks_obtained, test.max_marks)
                    : 0;
                  const grade = result.marks_obtained && !result.is_absent
                    ? calculateGrade(result.marks_obtained, test.max_marks)
                    : null;
                  const passed = result.marks_obtained >= test.pass_marks;
                  const isEditing = result.id in editingScores;

                  return (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {student?.first_name} {student?.last_name}
                      </TableCell>
                      <TableCell>{student?.admission_number}</TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            max={test.max_marks}
                            value={editingScores[result.id] ?? result.marks_obtained ?? ""}
                            onChange={(e) => handleScoreChange(result.id, e.target.value)}
                            className="w-20 text-right"
                            disabled={result.is_absent}
                          />
                        ) : (
                          <span>
                            {result.is_absent ? "-" : result.marks_obtained !== null ? `${result.marks_obtained}/${test.max_marks}` : "Not entered"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.is_absent ? "-" : percentage ? `${percentage}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {grade ? (
                          <Badge className={grade.color}>{grade.grade}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {result.is_absent ? (
                          <Badge variant="secondary">Absent</Badge>
                        ) : result.marks_obtained !== null ? (
                          passed ? (
                            <Badge variant="default">Pass</Badge>
                          ) : (
                            <Badge variant="destructive">Fail</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox checked={result.is_absent} disabled />
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Button
                            size="sm"
                            onClick={() => handleSaveScore(result.id, result.is_absent)}
                            disabled={updateResultMutation.isPending}
                          >
                            Save
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingScores({ [result.id]: result.marks_obtained })}
                          >
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No results found. Add students to this test.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
