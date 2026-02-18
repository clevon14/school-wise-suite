import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculatePercentage, calculateGrade } from "@/lib/grade-calculator";
import { Trophy, TrendingUp } from "lucide-react";

export function ClassAnalytics({ examId }: { examId: string }) {
  const { data: analytics } = useQuery({
    queryKey: ["class-analytics", examId],
    queryFn: async () => {
      // Get all exam subjects for this exam
      const { data: examSubjects, error: subjectsError } = await supabase
        .from("exam_subjects")
        .select("id, max_marks")
        .eq("exam_id", examId);
      
      if (subjectsError) throw subjectsError;

      // Get all marks for these exam subjects
      const examSubjectIds = examSubjects.map(es => es.id);
      const { data: marksRaw, error: marksError } = await supabase
        .from("marks")
        .select("*, student_id, marks_obtained, is_absent, exam_subject_id")
        .in("exam_subject_id", examSubjectIds);

      // Fetch students separately
      const studentIds = [...new Set((marksRaw || []).map(m => m.student_id))];
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .in("id", studentIds);

      const studentMap = Object.fromEntries((studentsData || []).map(s => [s.id, s]));
      const marks = (marksRaw || []).map(m => ({ ...m, students: studentMap[m.student_id] }));
      
      if (marksError) throw marksError;

      // Calculate total marks per student
      const studentTotals: Record<string, {
        student: any;
        totalMarks: number;
        maxMarks: number;
      }> = {};

      marks?.forEach(mark => {
        const studentId = mark.student_id;
        if (!studentTotals[studentId]) {
          studentTotals[studentId] = {
            student: mark.students,
            totalMarks: 0,
            maxMarks: 0,
          };
        }
        
        if (!mark.is_absent) {
          studentTotals[studentId].totalMarks += mark.marks_obtained || 0;
        }
      });

      // Add max marks
      const totalMaxMarks = examSubjects.reduce((sum, es) => sum + es.max_marks, 0);
      Object.values(studentTotals).forEach(st => {
        st.maxMarks = totalMaxMarks;
      });

      // Calculate average
      const totalStudents = Object.keys(studentTotals).length;
      const classTotal = Object.values(studentTotals).reduce((sum, st) => sum + st.totalMarks, 0);
      const classAverage = totalStudents > 0 ? classTotal / totalStudents : 0;

      // Get top 5 students
      const topStudents = Object.values(studentTotals)
        .sort((a, b) => b.totalMarks - a.totalMarks)
        .slice(0, 5)
        .map((st, index) => ({
          rank: index + 1,
          ...st.student,
          totalMarks: st.totalMarks,
          maxMarks: st.maxMarks,
          percentage: calculatePercentage(st.totalMarks, st.maxMarks),
          grade: calculateGrade(st.totalMarks, st.maxMarks),
        }));

      return {
        totalStudents,
        classAverage: Math.round(classAverage * 100) / 100,
        classAveragePercentage: totalMaxMarks > 0 ? calculatePercentage(classAverage, totalMaxMarks) : 0,
        topStudents,
        totalMaxMarks,
      };
    },
  });

  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-medium">Class Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl font-bold">
              {analytics.classAverage}/{analytics.totalMaxMarks}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.classAveragePercentage}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 md:px-6">
            <CardTitle className="text-sm font-medium">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <div className="text-2xl font-bold">
              {analytics.topStudents[0]?.totalMarks || 0}/{analytics.totalMaxMarks}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.topStudents[0]?.percentage || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning" />
            Top 5 Students
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[500px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Admission No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Total Marks</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold">#{student.rank}</TableCell>
                    <TableCell>{student.admission_number}</TableCell>
                    <TableCell>{student.first_name} {student.last_name}</TableCell>
                    <TableCell className="text-center">
                      {student.totalMarks}/{student.maxMarks}
                    </TableCell>
                    <TableCell className="text-center">{student.percentage}%</TableCell>
                    <TableCell className={`text-center font-semibold ${student.grade.color}`}>
                      {student.grade.grade}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
