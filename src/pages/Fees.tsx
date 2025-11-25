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
        title: "✓ Export Complete",
        description: `${allFeeRecords.length} fee records downloaded as CSV`,
      });
    } else {
      toast({
        title: "No Records Yet",
        description: "Set up fees first, then you can export them",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Fee Collection</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {allFeeRecords?.length ? `Managing ${allFeeRecords.length} fee records` : "Set up and collect fees"}
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} className="gap-2 h-11 w-full md:w-auto">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
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
