import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SearchFeesPayment() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");

  const { data: payments, isLoading } = useQuery({
    queryKey: ["searchPayments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          fee_assignment:fee_assignments(
            amount,
            status,
            student:students(first_name, last_name, admission_number, class:classes(name, section)),
            fee_category:fee_categories(name)
          )
        `)
        .order("payment_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const filtered = payments?.filter((p: any) => {
    const student = p.fee_assignment?.student;
    const keyword = searchKeyword.toLowerCase();
    const matchesSearch = !searchKeyword || 
      student?.first_name?.toLowerCase().includes(keyword) ||
      student?.last_name?.toLowerCase().includes(keyword) ||
      student?.admission_number?.toLowerCase().includes(keyword) ||
      p.receipt_number?.toLowerCase().includes(keyword);
    const matchesMethod = paymentMethod === "all" || p.payment_method === paymentMethod;
    return matchesSearch && matchesMethod;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Fees Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by student name, admission no, receipt..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading payments...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((payment: any) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">{payment.receipt_number}</TableCell>
                  <TableCell>
                    {payment.fee_assignment?.student
                      ? `${payment.fee_assignment.student.first_name} ${payment.fee_assignment.student.last_name}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {payment.fee_assignment?.student?.class
                      ? `${payment.fee_assignment.student.class.name}${payment.fee_assignment.student.class.section ? ' - ' + payment.fee_assignment.student.class.section : ''}`
                      : "-"}
                  </TableCell>
                  <TableCell>{payment.fee_assignment?.fee_category?.name || "-"}</TableCell>
                  <TableCell className="font-semibold">₹{Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{payment.payment_method}</Badge>
                  </TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No payment records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
