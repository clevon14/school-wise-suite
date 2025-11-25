import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { CollectTuitionFeeDialog } from "@/components/fees/CollectTuitionFeeDialog";
import { CollectBusFeeDialog } from "@/components/fees/CollectBusFeeDialog";
import { SimpleTuitionSetup } from "@/components/fees/SimpleTuitionSetup";
import { SimpleBusSetup } from "@/components/fees/SimpleBusSetup";
import { exportFeesCSV } from "@/lib/fee-csv-export";
import { useToast } from "@/hooks/use-toast";

export default function Fees() {
  const { toast } = useToast();

  const { data: allFeeRecords } = useQuery({
    queryKey: ["allFeeRecords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_assignments")
        .select(`
          *,
          student:students(
            first_name,
            last_name,
            admission_number,
            village,
            class:classes(name, section)
          ),
          fee_category:fee_categories(name)
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleExportCSV = () => {
    if (allFeeRecords && allFeeRecords.length > 0) {
      exportFeesCSV(allFeeRecords);
      toast({
        title: "Success",
        description: "Fee records exported successfully",
      });
    } else {
      toast({
        title: "No Data",
        description: "No fee records to export",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Fee Collection</h1>
          <p className="text-muted-foreground mt-1">Manage tuition and bus fees</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <CollectTuitionFeeDialog />
        <CollectBusFeeDialog />
      </div>

      {/* Setup Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        <SimpleTuitionSetup />
        <SimpleBusSetup />
      </div>
    </div>
  );
}
