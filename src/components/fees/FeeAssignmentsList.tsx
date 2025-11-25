import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function FeeAssignmentsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["feeAssignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(first_name, last_name, admission_number),
          fee_category:fee_categories(name, frequency)
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("fee_assignments")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeAssignments"] });
      queryClient.invalidateQueries({ queryKey: ["feeStats"] });
      toast({
        title: "Success",
        description: "Fee status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAssignments = assignments?.filter((assignment: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.student?.first_name.toLowerCase().includes(searchLower) ||
      assignment.student?.last_name.toLowerCase().includes(searchLower) ||
      assignment.student?.admission_number.toLowerCase().includes(searchLower) ||
      assignment.fee_category?.name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-success">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      case "partial":
        return <Badge variant="outline">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Assignments</CardTitle>
        <Input
          placeholder="Search by student name or admission number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading assignments...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No.</TableHead>
                <TableHead>Fee Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments?.map((assignment: any) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.student
                      ? `${assignment.student.first_name} ${assignment.student.last_name}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{assignment.student?.admission_number || "N/A"}</TableCell>
                  <TableCell>
                    {assignment.fee_category?.name || "N/A"}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({assignment.fee_category?.frequency})
                    </span>
                  </TableCell>
                  <TableCell>₹{Number(assignment.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(assignment.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={assignment.status}
                      onValueChange={(value) =>
                        updateStatus.mutate({ id: assignment.id, status: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
