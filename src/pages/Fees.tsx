import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { CSVExportButton } from "@/components/CSVExportButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddFeeCategoryDialog } from "@/components/fees/AddFeeCategoryDialog";
import { AssignFeesDialog } from "@/components/fees/AssignFeesDialog";
import { FeeAssignmentsList } from "@/components/fees/FeeAssignmentsList";
import { GenerateBusFeesDialog } from "@/components/fees/GenerateBusFeesDialog";
import { ClassFeeStructureManager } from "@/components/fees/ClassFeeStructureManager";
import { VillageBusFeesManager } from "@/components/fees/VillageBusFeesManager";
import { StudentSpecificFeesManager } from "@/components/fees/StudentSpecificFeesManager";
import { MonthlyFeeSummary } from "@/components/fees/MonthlyFeeSummary";
import { AddBusFeeDialog } from "@/components/fees/AddBusFeeDialog";
import { AddTuitionFeeDialog } from "@/components/fees/AddTuitionFeeDialog";

export default function Fees() {
  const { data: feeStats, isLoading: statsLoading } = useQuery({
    queryKey: ["feeStats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select("status, amount");
      
      if (error) throw error;
      
      const total = data?.reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
      const paid = data?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
      const pending = data?.filter(f => f.status === 'pending').reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
      const overdue = data?.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
      
      return { total, paid, pending, overdue, count: data?.length || 0 };
    },
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["recentPayments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          fee_assignment:fee_assignments(
            student:students(
              first_name, 
              last_name, 
              admission_number,
              class:classes(name, section)
            )
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Management</h2>
          <p className="text-muted-foreground">Track payments, generate receipts, and manage fee structure</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddTuitionFeeDialog />
          <AddBusFeeDialog />
          <CSVExportButton data={recentPayments || []} type="fees" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold">₹{feeStats?.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{feeStats?.count} assignments</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-success">₹{feeStats?.paid.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {feeStats?.total ? Math.round((feeStats.paid / feeStats.total) * 100) : 0}% collected
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-warning">₹{feeStats?.pending.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <>
                <div className="text-2xl font-bold text-destructive">₹{feeStats?.overdue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Fee Assignments</TabsTrigger>
          <TabsTrigger value="structure">Class Fee Structure</TabsTrigger>
          <TabsTrigger value="bus">Village Bus Fees</TabsTrigger>
          <TabsTrigger value="students">Student Settings</TabsTrigger>
          <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use these buttons to manage fee assignments:
              <strong> Assign Fees</strong> - Assign fees to individual students or entire classes.
              <strong> Generate Bus Fees</strong> - Auto-generate bus fees for all students with active transport.
              <strong> Add Fee Category</strong> - Create new fee types (e.g., exam fees, event fees).
            </p>
            <div className="flex gap-2 flex-wrap">
              <AssignFeesDialog />
              <GenerateBusFeesDialog />
              <AddFeeCategoryDialog />
            </div>
          </div>
          <FeeAssignmentsList />
        </TabsContent>

        <TabsContent value="structure">
          <ClassFeeStructureManager />
        </TabsContent>

        <TabsContent value="bus">
          <VillageBusFeesManager />
        </TabsContent>

        <TabsContent value="students">
          <StudentSpecificFeesManager />
        </TabsContent>

        <TabsContent value="summary">
          <MonthlyFeeSummary />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <p>Loading payments...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt No.</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments?.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.receipt_number}</TableCell>
                    <TableCell>
                      {payment.fee_assignment?.student
                        ? `${payment.fee_assignment.student.first_name} ${payment.fee_assignment.student.last_name}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {payment.fee_assignment?.student?.class
                        ? `${payment.fee_assignment.student.class.name}${payment.fee_assignment.student.class.section ? ' - ' + payment.fee_assignment.student.class.section : ''}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>₹{Number(payment.amount).toLocaleString()}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant="default">Paid</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
