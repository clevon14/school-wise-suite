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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save } from "lucide-react";

export function ClassFeeStructureManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

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

  const { data: feeStructures, isLoading } = useQuery({
    queryKey: ["classFeeStructures", academicYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_fee_structure")
        .select("*, class:classes(name, section)")
        .eq("academic_year", academicYear);
      if (error) throw error;
      return data;
    },
  });

  const saveFeeStructure = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) {
        const { error } = await supabase
          .from("class_fee_structure")
          .update(data)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("class_fee_structure")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classFeeStructures"] });
      toast({
        title: "Success",
        description: "Fee structure saved successfully",
      });
      setEditingId(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (structure: any) => {
    setEditingId(structure.id);
    setFormData(structure);
  };

  const handleAddNew = (classId: string) => {
    setEditingId("new-" + classId);
    setFormData({
      class_id: classId,
      academic_year: academicYear,
      tuition_fee: 0,
      lab_fee: 0,
      library_fee: 0,
      sports_fee: 0,
      other_fees: 0,
    });
  };

  const handleSave = () => {
    saveFeeStructure.mutate(formData);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const getStructureForClass = (classId: string) => {
    return feeStructures?.find((s: any) => s.class_id === classId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Class-wise Tuition Fee Structure ({academicYear})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Tuition Fee</TableHead>
                <TableHead>Lab Fee</TableHead>
                <TableHead>Library Fee</TableHead>
                <TableHead>Sports Fee</TableHead>
                <TableHead>Other Fees</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes?.map((cls: any) => {
                const structure = getStructureForClass(cls.id);
                const isEditing = editingId === structure?.id || editingId === "new-" + cls.id;

                return (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">
                      {cls.name} {cls.section && `- ${cls.section}`}
                    </TableCell>
                    {isEditing ? (
                      <>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.tuition_fee || 0}
                            onChange={(e) =>
                              setFormData({ ...formData, tuition_fee: Number(e.target.value) })
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.lab_fee || 0}
                            onChange={(e) =>
                              setFormData({ ...formData, lab_fee: Number(e.target.value) })
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.library_fee || 0}
                            onChange={(e) =>
                              setFormData({ ...formData, library_fee: Number(e.target.value) })
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.sports_fee || 0}
                            onChange={(e) =>
                              setFormData({ ...formData, sports_fee: Number(e.target.value) })
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={formData.other_fees || 0}
                            onChange={(e) =>
                              setFormData({ ...formData, other_fees: Number(e.target.value) })
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="font-bold">
                          ₹
                          {(
                            Number(formData.tuition_fee || 0) +
                            Number(formData.lab_fee || 0) +
                            Number(formData.library_fee || 0) +
                            Number(formData.sports_fee || 0) +
                            Number(formData.other_fees || 0)
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : structure ? (
                      <>
                        <TableCell>₹{Number(structure.tuition_fee).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(structure.lab_fee).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(structure.library_fee).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(structure.sports_fee).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(structure.other_fees).toLocaleString()}</TableCell>
                        <TableCell className="font-bold">
                          ₹
                          {(
                            Number(structure.tuition_fee) +
                            Number(structure.lab_fee) +
                            Number(structure.library_fee) +
                            Number(structure.sports_fee) +
                            Number(structure.other_fees)
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(structure)}>
                            Edit
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          Not configured
                        </TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleAddNew(cls.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
