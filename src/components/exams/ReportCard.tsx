import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateGrade, calculatePercentage, calculateTotalMarks, calculateMaxMarks } from "@/lib/grade-calculator";
import { Printer } from "lucide-react";

export function ReportCard({ examId, studentId }: { examId: string; studentId: string }) {
  const { data: student } = useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*, classes(name, section)")
        .eq("id", studentId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: exam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: marks } = useQuery({
    queryKey: ["student-marks", examId, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marks")
        .select(`
          *,
          exam_subjects!inner(
            *,
            subjects(name),
            exams!inner(id)
          )
        `)
        .eq("student_id", studentId)
        .eq("exam_subjects.exams.id", examId);
      
      if (error) throw error;
      return data;
    },
  });

  const totalMarksObtained = calculateTotalMarks(marks || []);
  const maxMarks = calculateMaxMarks((marks?.map(m => m.exam_subjects) || []) as { max_marks: number }[]);
  const percentage = calculatePercentage(totalMarksObtained, maxMarks);
  const overallGrade = calculateGrade(totalMarksObtained, maxMarks);

  const handlePrint = () => {
    window.print();
  };

  if (!student || !exam || !marks) return <div>Loading...</div>;

  return (
    <div className="space-y-4 print:p-8">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold">Report Card</h2>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <Card className="print:shadow-none">
        <CardHeader className="text-center border-b print:pb-6">
          <CardTitle className="text-3xl">Holy Cross School</CardTitle>
          <p className="text-lg font-semibold mt-2">{exam.name}</p>
          <p className="text-sm text-muted-foreground">Academic Year: {exam.academic_year}</p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-semibold">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission No.</p>
              <p className="font-semibold">{student.admission_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Class</p>
              <p className="font-semibold">
                {student.classes?.name} {student.classes?.section || ""}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-semibold">{student.date_of_birth || "-"}</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-center">Max Marks</TableHead>
                <TableHead className="text-center">Marks Obtained</TableHead>
                <TableHead className="text-center">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((mark) => {
                const grade = mark.is_absent 
                  ? { grade: "AB", description: "Absent", color: "text-muted-foreground" }
                  : calculateGrade(mark.marks_obtained || 0, mark.exam_subjects.max_marks);
                
                return (
                  <TableRow key={mark.id}>
                    <TableCell>{mark.exam_subjects.subjects?.name}</TableCell>
                    <TableCell className="text-center">{mark.exam_subjects.max_marks}</TableCell>
                    <TableCell className="text-center">
                      {mark.is_absent ? "AB" : mark.marks_obtained || 0}
                    </TableCell>
                    <TableCell className={`text-center font-semibold ${grade.color}`}>
                      {grade.grade}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-center">{maxMarks}</TableCell>
                <TableCell className="text-center">{totalMarksObtained}</TableCell>
                <TableCell className={`text-center ${overallGrade.color}`}>
                  {overallGrade.grade}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Marks</p>
              <p className="text-2xl font-bold">{totalMarksObtained}/{maxMarks}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Percentage</p>
              <p className="text-2xl font-bold">{percentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className={`text-2xl font-bold ${overallGrade.color}`}>
                {overallGrade.grade} - {overallGrade.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:p-8, .print\\:p-8 * {
            visibility: visible;
          }
          .print\\:p-8 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
