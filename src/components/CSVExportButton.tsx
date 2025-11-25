import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportStudents,
  exportTeachers,
  exportAttendance,
  exportFees,
  exportExamResults,
} from "@/lib/csv-export";

interface CSVExportButtonProps {
  data: any[];
  type: "students" | "teachers" | "attendance" | "fees" | "exam_results";
}

export function CSVExportButton({ data, type }: CSVExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    switch (type) {
      case "students":
        exportStudents(data);
        break;
      case "teachers":
        exportTeachers(data);
        break;
      case "attendance":
        exportAttendance(data);
        break;
      case "fees":
        exportFees(data);
        break;
      case "exam_results":
        exportExamResults(data);
        break;
    }
  };

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
