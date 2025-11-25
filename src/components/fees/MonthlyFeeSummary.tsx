import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function MonthlyFeeSummary() {
  const { data: studentSummary, isLoading: studentsLoading } = useQuery({
    queryKey: ["studentMonthlyFeeSummary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_monthly_fee_summary")
        .select("*")
        .order("class_name")
        .order("last_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: classSummary, isLoading: classesLoading } = useQuery({
    queryKey: ["classMonthlyFeeSummary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_monthly_fee_summary")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Fee Summary (Current Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="students">
          <TabsList>
            <TabsTrigger value="students">Student-wise</TabsTrigger>
            <TabsTrigger value="classes">Class-wise</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            {studentsLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Village</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentSummary?.map((student: any) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">
                        {student.first_name} {student.last_name}
                      </TableCell>
                      <TableCell>{student.admission_number}</TableCell>
                      <TableCell>
                        {student.class_name} {student.section && `- ${student.section}`}
                      </TableCell>
                      <TableCell>{student.village || "-"}</TableCell>
                      <TableCell>₹{Number(student.total_monthly_fee).toLocaleString()}</TableCell>
                      <TableCell className="text-success">
                        ₹{Number(student.paid_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-warning">
                        ₹{Number(student.pending_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {student.pending_amount > 0 ? (
                          <Badge variant="secondary">Pending</Badge>
                        ) : (
                          <Badge variant="default" className="bg-success">Paid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="classes">
            {classesLoading ? (
              <p>Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Total Fees</TableHead>
                    <TableHead>Collected</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Collection %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classSummary?.map((cls: any) => (
                    <TableRow key={cls.class_id}>
                      <TableCell className="font-medium">
                        {cls.class_name} {cls.section && `- ${cls.section}`}
                      </TableCell>
                      <TableCell>{cls.total_students}</TableCell>
                      <TableCell>₹{Number(cls.total_monthly_fees).toLocaleString()}</TableCell>
                      <TableCell className="text-success">
                        ₹{Number(cls.collected_amount).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-warning">
                        ₹{Number(cls.pending_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={cls.collection_percentage || 0} className="w-20" />
                          <span className="text-sm">{cls.collection_percentage || 0}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
