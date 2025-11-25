import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

type CSVAttendanceRow = {
  admission_number: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks?: string;
};

export function CSVAttendanceImport({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const parseCSV = (text: string): CSVAttendanceRow[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const admissionIndex = headers.indexOf("admission_number");
    const dateIndex = headers.indexOf("date");
    const statusIndex = headers.indexOf("status");
    const remarksIndex = headers.indexOf("remarks");

    if (admissionIndex === -1 || dateIndex === -1 || statusIndex === -1) {
      throw new Error(
        "CSV must have columns: admission_number, date, status"
      );
    }

    const rows: CSVAttendanceRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const status = values[statusIndex].toLowerCase();

      if (!["present", "absent", "late", "excused"].includes(status)) {
        throw new Error(
          `Invalid status "${status}" at line ${i + 1}. Must be: present, absent, late, or excused`
        );
      }

      rows.push({
        admission_number: values[admissionIndex],
        date: values[dateIndex],
        status: status as any,
        remarks: remarksIndex !== -1 ? values[remarksIndex] : undefined,
      });
    }

    return rows;
  };

  const importAttendance = useMutation({
    mutationFn: async (csvRows: CSVAttendanceRow[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get student IDs from admission numbers
      const admissionNumbers = [...new Set(csvRows.map((r) => r.admission_number))];
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id, admission_number")
        .in("admission_number", admissionNumbers);

      if (studentsError) throw studentsError;
      if (!students || students.length === 0) {
        throw new Error("No matching students found");
      }

      const studentMap = new Map(
        students.map((s) => [s.admission_number, s.id])
      );

      // Prepare attendance records
      const attendanceRecords = csvRows
        .map((row) => {
          const studentId = studentMap.get(row.admission_number);
          if (!studentId) {
            console.warn(`Student not found: ${row.admission_number}`);
            return null;
          }

          return {
            student_id: studentId,
            date: row.date,
            status: row.status,
            remarks: row.remarks || null,
            marked_by: user.id,
          };
        })
        .filter(Boolean);

      if (attendanceRecords.length === 0) {
        throw new Error("No valid attendance records to import");
      }

      // Delete existing records for the same dates/students
      const uniqueDates = [...new Set(attendanceRecords.map((r) => r.date))];
      const studentIds = attendanceRecords.map((r) => r.student_id);

      for (const date of uniqueDates) {
        await supabase
          .from("attendance")
          .delete()
          .eq("date", date)
          .in("student_id", studentIds);
      }

      // Insert new records
      const { error: insertError } = await supabase
        .from("attendance")
        .insert(attendanceRecords as any);

      if (insertError) throw insertError;

      return attendanceRecords.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-report"] });
      queryClient.invalidateQueries({ queryKey: ["today-attendance-stats"] });
      toast.success(`Successfully imported ${count} attendance records`);
      setOpen(false);
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to import attendance");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    try {
      const text = await file.text();
      const csvRows = parseCSV(text);
      importAttendance.mutate(csvRows);
    } catch (error: any) {
      toast.error(error.message || "Failed to parse CSV file");
    }
  };

  const downloadTemplate = () => {
    const template = `admission_number,date,status,remarks
ST001,2024-01-15,present,
ST002,2024-01-15,absent,Sick
ST003,2024-01-15,late,Traffic
ST004,2024-01-15,excused,Doctor appointment`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Attendance from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns: admission_number, date, status, remarks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">CSV Format:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• <strong>admission_number</strong>: Student's admission number</li>
              <li>• <strong>date</strong>: Date in YYYY-MM-DD format</li>
              <li>• <strong>status</strong>: present, absent, late, or excused</li>
              <li>• <strong>remarks</strong>: Optional notes</li>
            </ul>
          </div>

          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            Download Template
          </Button>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importAttendance.isPending}
            >
              {importAttendance.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
