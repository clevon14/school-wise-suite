import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { AddClassDialog } from "@/components/forms/AddClassDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToCSV } from "@/lib/csv-export-client";
import { toast } from "sonner";

export default function Classes() {
  const { data: classes, isLoading } = useQuery({
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

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Classes</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {classes?.length ? `${classes.length} classes configured` : "Set up your classes"}
          </p>
        </div>
        <AddClassDialog>
          <Button className="h-11 w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </AddClassDialog>
      </div>

      <Card>
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="text-lg md:text-xl">All Classes</CardTitle>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          {isLoading ? (
            <p className="px-4 md:px-0">Loading classes...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes?.map((classItem) => (
                  <TableRow key={classItem.id}>
                    <TableCell className="font-medium">{classItem.name}</TableCell>
                    <TableCell>{classItem.section || "-"}</TableCell>
                    <TableCell>{classItem.academic_year}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">View</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              await exportToCSV({
                                scope: 'class',
                                id: classItem.id,
                              });
                              toast.success("Class summary exported");
                            } catch (error) {
                              toast.error("Failed to export class summary");
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
