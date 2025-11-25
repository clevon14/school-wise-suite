import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";

export function SimpleTuitionSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: feeStructures } = useQuery({
    queryKey: ["classFeeStructures", academicYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_fee_structure")
        .select("*")
        .eq("academic_year", academicYear);
      if (error) throw error;
      return data;
    },
  });

  const saveFee = useMutation({
    mutationFn: async ({ classId, amount }: { classId: string; amount: number }) => {
      const { error } = await supabase
        .from("class_fee_structure")
        .upsert([{
          class_id: classId,
          academic_year: academicYear,
          tuition_fee: amount,
          lab_fee: 0,
          library_fee: 0,
          sports_fee: 0,
          other_fees: 0,
        }], { onConflict: 'class_id,academic_year' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classFeeStructures"] });
      toast({ title: "Success", description: "Tuition fee updated" });
      setEditingId(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (classId: string, currentAmount: number) => {
    setEditingId(classId);
    setEditAmount(currentAmount.toString());
  };

  const handleSave = (classId: string) => {
    saveFee.mutate({ classId, amount: Number(editAmount) });
  };

  const getStructureForClass = (classId: string) => {
    return feeStructures?.find((s: any) => s.class_id === classId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Tuition Fees (Class-wise)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {classes?.map((cls: any) => {
            const structure = getStructureForClass(cls.id);
            const isEditing = editingId === cls.id;

            return (
              <div
                key={cls.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="font-medium">
                  {cls.name} {cls.section && `- ${cls.section}`}
                </div>
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-32"
                        placeholder="Amount"
                      />
                      <Button size="sm" onClick={() => handleSave(cls.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-semibold min-w-[100px] text-right">
                        ₹{structure ? Number(structure.tuition_fee).toLocaleString() : "0"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleEdit(cls.id, structure ? Number(structure.tuition_fee) : 0)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
