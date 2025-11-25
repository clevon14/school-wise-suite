import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ReportCards() {
  const { data: exams } = useQuery({
    queryKey: ["exams-for-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          class:classes(name, section),
          exam_subjects(
            id,
            subject:subjects(name, code),
            max_marks,
            pass_marks
          )
        `)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: allMarks } = useQuery({
    queryKey: ["all-marks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select(`
          *,
          student:students(id, first_name, last_name, admission_number),
          exam_subject:exam_subjects(
            subject:subjects(name, code),
            max_marks,
            pass_marks,
            exam:exams(id, name)
          )
        `);
      
      if (error) throw error;
      return data;
    },
  });

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-success' };
    if (percentage >= 80) return { grade: 'A', color: 'text-success' };
    if (percentage >= 70) return { grade: 'B', color: 'text-primary' };
    if (percentage >= 60) return { grade: 'C', color: 'text-warning' };
    if (percentage >= 50) return { grade: 'D', color: 'text-warning' };
    return { grade: 'F', color: 'text-destructive' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Report Cards</h2>
          <p className="text-muted-foreground">Generate and download student report cards</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Generate All Reports
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(allMarks?.map(m => m.student.id)).size || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Award className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allMarks && allMarks.length > 0
                ? Math.round(
                    allMarks.reduce((sum, m) => sum + (m.marks_obtained || 0), 0) /
                    allMarks.length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {exams && exams.length > 0 ? (
        <div className="space-y-4">
          {exams.map((exam: any) => {
            const examMarks = allMarks?.filter(m => m.exam_subject?.exam?.id === exam.id) || [];
            const studentResults = examMarks.reduce((acc: any, mark: any) => {
              const studentId = mark.student.id;
              if (!acc[studentId]) {
                acc[studentId] = {
                  student: mark.student,
                  marks: [],
                  total: 0,
                  maxTotal: 0,
                };
              }
              acc[studentId].marks.push(mark);
              acc[studentId].total += mark.marks_obtained || 0;
              acc[studentId].maxTotal += mark.exam_subject?.max_marks || 0;
              return acc;
            }, {});

            return (
              <Card key={exam.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{exam.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {exam.class ? `${exam.class.name} ${exam.class.section || ''}` : 'All Classes'} • 
                        {new Date(exam.start_date).toLocaleDateString()} to {new Date(exam.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{exam.exam_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.keys(studentResults).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Admission No.</TableHead>
                          <TableHead className="text-right">Total Marks</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                          <TableHead className="text-right">Grade</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(studentResults).map((result: any) => {
                          const percentage = (result.total / result.maxTotal) * 100;
                          const { grade, color } = calculateGrade(percentage);
                          
                          return (
                            <TableRow key={result.student.id}>
                              <TableCell className="font-medium">
                                {result.student.first_name} {result.student.last_name}
                              </TableCell>
                              <TableCell>{result.student.admission_number}</TableCell>
                              <TableCell className="text-right">
                                {result.total}/{result.maxTotal}
                              </TableCell>
                              <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className={color}>{grade}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="outline" size="sm">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No marks entered for this exam yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">No exams available for report generation</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
