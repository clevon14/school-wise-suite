import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export function FeesDiscount() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [discountAmounts, setDiscountAmounts] = useState<Record<string, string>>({});

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingFees, isLoading } = useQuery({
    queryKey: ["pendingFeesForDiscount"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(first_name, last_name, admission_number, class_id, class:classes(name, section)),
          fee_category:fee_categories(name)
        `)
        .in("status", ["pending", "overdue", "partial"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const applyDiscountMutation = useMutation({
    mutationFn: async ({ id, discountAmount }: { id: string; discountAmount: number }) => {
      const fee = pendingFees?.find((f: any) => f.id === id);
      if (!fee) throw new Error("Fee not found");
      const newAmount = Math.max(0, Number(fee.amount) - discountAmount);
      const { error } = await supabase
        .from("fee_assignments")
        .update({ amount: newAmount })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingFeesForDiscount"] });
      queryClient.invalidateQueries({ queryKey: ["students-for-fees"] });
      queryClient.invalidateQueries({ queryKey: ["allFeeRecords"] });
      toast({ title: "Success", description: "Discount applied successfully" });
      setDiscountAmounts({});
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filtered = pendingFees?.filter((f: any) => {
    const keyword = searchKeyword.toLowerCase();
    const matchesSearch = !searchKeyword ||
      f.student?.first_name?.toLowerCase().includes(keyword) ||
      f.student?.last_name?.toLowerCase().includes(keyword) ||
      f.student?.admission_number?.toLowerCase().includes(keyword);
    const matchesClass = selectedClass === "all" || f.student?.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fees Discount</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Current Amount</TableHead>
                <TableHead>Discount Amount</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((fee: any) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "N/A"}</TableCell>
                  <TableCell>
                    {fee.student?.class ? `${fee.student.class.name}${fee.student.class.section ? ' - ' + fee.student.class.section : ''}` : "-"}
                  </TableCell>
                  <TableCell>{fee.fee_category?.name || "-"}</TableCell>
                  <TableCell className="font-semibold">₹{Number(fee.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discountAmounts[fee.id] || ""}
                      onChange={(e) => setDiscountAmounts({ ...discountAmounts, [fee.id]: e.target.value })}
                      className="w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!discountAmounts[fee.id] || applyDiscountMutation.isPending}
                      onClick={() => {
                        const amt = parseFloat(discountAmounts[fee.id]);
                        if (amt > 0 && amt <= Number(fee.amount)) {
                          applyDiscountMutation.mutate({ id: fee.id, discountAmount: amt });
                        } else {
                          toast({ title: "Invalid", description: "Enter a valid discount amount", variant: "destructive" });
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!filtered || filtered.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No pending fees to apply discount
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
