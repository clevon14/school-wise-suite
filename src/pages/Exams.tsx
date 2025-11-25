import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileEdit, BarChart3 } from "lucide-react";
import { CreateExamDialog } from "@/components/exams/CreateExamDialog";
import { AddExamSubjectsDialog } from "@/components/exams/AddExamSubjectsDialog";
import { MarksEntryDialog } from "@/components/exams/MarksEntryDialog";
import { ReportCard } from "@/components/exams/ReportCard";
import { ClassAnalytics } from "@/components/exams/ClassAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function Exams() {
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          classes(name, section)
        `)
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: examSubjects } = useQuery({
    queryKey: ["exam-subjects", selectedExamId],
    queryFn: async () => {
      if (!selectedExamId) return [];
      const { data, error } = await supabase
        .from("exam_subjects")
        .select(`
          *,
          subjects(name, code)
        `)
        .eq("exam_id", selectedExamId)
        .order("exam_date");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedExamId,
  });

  const { data: students } = useQuery({
    queryKey: ["students-for-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, class_id")
        .eq("status", "active")
        .order("first_name");
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Exams & Results</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage exams, enter marks, and generate reports</p>
        </div>
        <CreateExamDialog>
          <Button className="flex-1 md:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Exam</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </CreateExamDialog>
      </div>

      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-4 md:inline-grid">
          <TabsTrigger value="exams" className="text-xs md:text-sm">Exams</TabsTrigger>
          <TabsTrigger value="marks" className="text-xs md:text-sm">Marks</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm">Reports</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl">All Exams</CardTitle>
            </CardHeader>
            <CardContent className="px-0 md:px-6">
              {isLoading ? (
                <p className="px-4 md:px-0">Loading exams...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams?.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium">{exam.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {exam.exam_type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exam.classes?.name} {exam.classes?.section || ""}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(exam.start_date).toLocaleDateString()} - {new Date(exam.end_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <AddExamSubjectsDialog examId={exam.id}>
                              <Button variant="outline" size="sm">
                                <Plus className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Subjects</span>
                              </Button>
                            </AddExamSubjectsDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marks" className="space-y-4">
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl">Enter Marks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:px-6">
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name} - {exam.classes?.name} {exam.classes?.section || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedExamId && (
                <div className="overflow-x-auto">
                  <Table className="min-w-[500px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Exam Date</TableHead>
                        <TableHead>Max Marks</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examSubjects?.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>{subject.subjects?.name}</TableCell>
                          <TableCell>{subject.subjects?.code || "-"}</TableCell>
                          <TableCell>{new Date(subject.exam_date).toLocaleDateString()}</TableCell>
                          <TableCell>{subject.max_marks}</TableCell>
                          <TableCell>
                            <MarksEntryDialog examSubjectId={subject.id}>
                              <Button variant="outline" size="sm">
                                <FileEdit className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Enter Marks</span>
                                <span className="sm:hidden">Enter</span>
                              </Button>
                            </MarksEntryDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl">Generate Report Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams?.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.admission_number} - {student.first_name} {student.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExamId && selectedStudentId && (
                <ReportCard examId={selectedExamId} studentId={selectedStudentId} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader className="px-4 md:px-6">
              <CardTitle className="text-lg md:text-xl">Class Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:px-6">
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.name} - {exam.classes?.name} {exam.classes?.section || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedExamId && <ClassAnalytics examId={selectedExamId} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
