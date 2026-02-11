import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export function SearchDueFees() {
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: dueFees, isLoading } = useQuery({
    queryKey: ["dueFees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(first_name, last_name, admission_number, class_id, parent_phone, class:classes(name, section)),
          fee_category:fee_categories(name)
        `)
        .in("status", ["pending", "overdue", "partial"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = dueFees?.filter((f: any) => {
    const keyword = searchKeyword.toLowerCase();
    const matchesSearch = !searchKeyword ||
      f.student?.first_name?.toLowerCase().includes(keyword) ||
      f.student?.last_name?.toLowerCase().includes(keyword) ||
      f.student?.admission_number?.toLowerCase().includes(keyword);
    const matchesClass = selectedClass === "all" || f.student?.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  const totalDue = filtered?.reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Due Fees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes?.map((cls: any) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- ${cls.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search by student name or admission no..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <div className="flex items-center px-4 bg-destructive/10 rounded-lg">
            <span className="text-sm font-medium text-destructive">
              Total Due: ₹{totalDue.toLocaleString()}
            </span>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission No</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mobile</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((fee: any) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "N/A"}</TableCell>
                  <TableCell>{fee.student?.admission_number || "-"}</TableCell>
                  <TableCell>
                    {fee.student?.class ? `${fee.student.class.name}${fee.student.class.section ? ' - ' + fee.student.class.section : ''}` : "-"}
                  </TableCell>
                  <TableCell>{fee.fee_category?.name || "-"}</TableCell>
                  <TableCell className="font-semibold text-destructive">₹{Number(fee.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={fee.status === "overdue" ? "destructive" : "secondary"} className="capitalize">
                      {fee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{fee.student?.parent_phone || "-"}</TableCell>
                </TableRow>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No due fees found
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
