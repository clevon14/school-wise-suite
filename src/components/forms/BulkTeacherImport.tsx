import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from "xlsx";

interface ParsedTeacher {
  row: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

const FIELD_MAPPINGS = [
  { key: "employee_number", label: "Employee No.", required: true },
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "gender", label: "Gender", required: false },
  { key: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: false },
  { key: "father_name", label: "Father's Name", required: false },
  { key: "mother_name", label: "Mother's Name", required: false },
  { key: "marital_status", label: "Marital Status", required: false },
  { key: "address", label: "Current Address", required: false },
  { key: "permanent_address", label: "Permanent Address", required: false },
  { key: "emergency_contact_number", label: "Emergency Contact", required: false },
  { key: "qualification", label: "Qualification", required: false },
  { key: "work_experience", label: "Work Experience", required: false },
  { key: "department", label: "Department", required: false },
  { key: "designation", label: "Designation", required: false },
  { key: "role", label: "Role", required: false },
  { key: "hire_date", label: "Hire Date (YYYY-MM-DD)", required: false },
  { key: "contract_type", label: "Contract Type", required: false },
  { key: "work_shift", label: "Work Shift", required: false },
  { key: "work_location", label: "Work Location", required: false },
  { key: "basic_salary", label: "Basic Salary", required: false },
  { key: "pan_number", label: "PAN Number", required: false },
  { key: "epf_number", label: "EPF Number", required: false },
  { key: "bank_account_title", label: "Bank Account Title", required: false },
  { key: "bank_account_number", label: "Bank Account Number", required: false },
  { key: "bank_name", label: "Bank Name", required: false },
  { key: "ifsc_code", label: "IFSC Code", required: false },
  { key: "bank_branch_name", label: "Bank Branch", required: false },
  { key: "medical_leave", label: "Medical Leave Days", required: false },
  { key: "casual_leave", label: "Casual Leave Days", required: false },
  { key: "sick_leave", label: "Sick Leave Days", required: false },
  { key: "maternity_leave", label: "Maternity Leave Days", required: false },
  { key: "note", label: "Notes", required: false },
];

const excelDateToString = (excelDate: number): string => {
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split("T")[0];
};

export function BulkTeacherImport({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedTeacher[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          currentRow.push(currentField.trim());
          currentField = "";
        } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
          currentRow.push(currentField.trim());
          if (currentRow.some((cell) => cell !== "")) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
          if (char === "\r") i++;
        } else if (char !== "\r") {
          currentField += char;
        }
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const parseExcel = (buffer: ArrayBuffer): string[][] => {
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 });

    return jsonData.map((row) =>
      row.map((cell) => {
        if (typeof cell === "number" && cell > 25000 && cell < 50000) {
          return excelDateToString(cell);
        }
        return cell?.toString() || "";
      })
    );
  };

  const validateTeacher = (data: Record<string, string>, row: number): ParsedTeacher => {
    const errors: string[] = [];

    if (!data.employee_number?.trim()) {
      errors.push("Employee number is required");
    }
    if (!data.first_name?.trim()) {
      errors.push("First name is required");
    }
    if (!data.last_name?.trim()) {
      errors.push("Last name is required");
    }
    if (!data.email?.trim()) {
      errors.push("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push("Invalid email format");
    }

    if (data.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth)) {
      errors.push("Date of birth must be YYYY-MM-DD format");
    }
    if (data.hire_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.hire_date)) {
      errors.push("Hire date must be YYYY-MM-DD format");
    }

    return { row, data, errors, isValid: errors.length === 0 };
  };

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setResults(null);
      setParsedData([]);

      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          let rows: string[][];

          if (isExcel) {
            rows = parseExcel(e.target?.result as ArrayBuffer);
          } else {
            rows = parseCSV(e.target?.result as string);
          }

          if (rows.length < 2) {
            toast({
              title: "Invalid file",
              description: "File must contain headers and at least one data row",
              variant: "destructive",
            });
            return;
          }

          const headers = rows[0].map((h) => h.toLowerCase().trim());
          const dataRows = rows.slice(1);

          const parsed: ParsedTeacher[] = dataRows.map((row, index) => {
            const data: Record<string, string> = {};

            FIELD_MAPPINGS.forEach((field) => {
              const headerIndex = headers.findIndex(
                (h) =>
                  h === field.key.toLowerCase() ||
                  h === field.label.toLowerCase() ||
                  h.replace(/[^a-z0-9]/g, "") === field.key.replace(/_/g, "")
              );
              if (headerIndex !== -1) {
                data[field.key] = row[headerIndex]?.trim() || "";
              }
            });

            return validateTeacher(data, index + 2);
          });

          setParsedData(parsed);

          const validCount = parsed.filter((p) => p.isValid).length;
          toast({
            title: "File parsed",
            description: `Found ${parsed.length} records (${validCount} valid, ${parsed.length - validCount} with errors)`,
          });
        } catch (error) {
          toast({
            title: "Parse error",
            description: "Failed to parse file. Please check the format.",
            variant: "destructive",
          });
        }
      };

      if (isExcel) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }

      event.target.value = "";
    },
    [toast]
  );

  const importTeachers = useMutation({
    mutationFn: async () => {
      const validTeachers = parsedData.filter((p) => p.isValid);
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < validTeachers.length; i++) {
        const { data } = validTeachers[i];

        try {
          const { error } = await supabase.from("employees").insert({
            employee_number: data.employee_number,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            gender: data.gender || null,
            date_of_birth: data.date_of_birth || null,
            father_name: data.father_name || null,
            mother_name: data.mother_name || null,
            marital_status: data.marital_status || null,
            address: data.address || null,
            permanent_address: data.permanent_address || null,
            emergency_contact_number: data.emergency_contact_number || null,
            qualification: data.qualification || null,
            work_experience: data.work_experience || null,
            department: data.department || null,
            designation: data.designation || null,
            role: data.role || "teacher",
            hire_date: data.hire_date || null,
            contract_type: data.contract_type || null,
            work_shift: data.work_shift || null,
            work_location: data.work_location || null,
            basic_salary: data.basic_salary ? parseFloat(data.basic_salary) : null,
            pan_number: data.pan_number || null,
            epf_number: data.epf_number || null,
            bank_account_title: data.bank_account_title || null,
            bank_account_number: data.bank_account_number || null,
            bank_name: data.bank_name || null,
            ifsc_code: data.ifsc_code || null,
            bank_branch_name: data.bank_branch_name || null,
            medical_leave: data.medical_leave ? parseInt(data.medical_leave) : 0,
            casual_leave: data.casual_leave ? parseInt(data.casual_leave) : 0,
            sick_leave: data.sick_leave ? parseInt(data.sick_leave) : 0,
            maternity_leave: data.maternity_leave ? parseInt(data.maternity_leave) : 0,
            note: data.note || null,
            status: "active",
          });

          if (error) {
            console.error(`Row ${validTeachers[i].row}:`, error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Row ${validTeachers[i].row}:`, err);
          failCount++;
        }

        setProgress(Math.round(((i + 1) / validTeachers.length) * 100));
      }

      return { success: successCount, failed: failCount };
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ["teachers"] });

      if (data.success > 0) {
        toast({
          title: "Import complete",
          description: `Successfully imported ${data.success} teachers${data.failed > 0 ? `, ${data.failed} failed` : ""}`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);
    await importTeachers.mutateAsync();
    setImporting(false);
  };

  const downloadTemplate = (format: "csv" | "xlsx") => {
    const headers = FIELD_MAPPINGS.map((f) => f.label);
    const sampleRow = [
      "EMP001",
      "John",
      "Doe",
      "john.doe@school.com",
      "9876543210",
      "Male",
      "1985-06-15",
      "Robert Doe",
      "Mary Doe",
      "Married",
      "123 Main St",
      "456 Home Ave",
      "9876543211",
      "M.Ed, B.Ed",
      "5 years",
      "Mathematics",
      "Senior Teacher",
      "teacher",
      "2020-04-01",
      "Permanent",
      "Morning",
      "Main Campus",
      "45000",
      "ABCDE1234F",
      "EPF123456",
      "John Doe",
      "123456789012",
      "State Bank",
      "SBIN0001234",
      "City Branch",
      "10",
      "12",
      "6",
      "180",
      "Experienced math teacher",
    ];

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

      const colWidths = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Teachers");
      XLSX.writeFile(wb, "teacher_import_template.xlsx");
    } else {
      const csvContent = [headers.join(","), sampleRow.map((v) => `"${v}"`).join(",")].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "teacher_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Template downloaded",
      description: `Use this ${format.toUpperCase()} template to prepare your teacher data`,
    });
  };

  const validCount = parsedData.filter((p) => p.isValid).length;
  const invalidCount = parsedData.length - validCount;

  const resetState = () => {
    setParsedData([]);
    setResults(null);
    setProgress(0);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetState();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Teacher Import
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Template Download */}
          <div className="flex flex-wrap gap-2 items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Download Template</p>
              <p className="text-xs text-muted-foreground">
                Use template with all {FIELD_MAPPINGS.length} fields
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("xlsx")}>
                <Download className="h-4 w-4 mr-1" />
                Excel Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>
                <Download className="h-4 w-4 mr-1" />
                CSV Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <Label>Upload File (CSV or Excel)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="teacher-file-upload"
              />
              <label htmlFor="teacher-file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload CSV or Excel file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Required: Employee No., First Name, Last Name, Email
                </p>
              </label>
            </div>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col space-y-3">
              <div className="flex items-center gap-4">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {invalidCount} Errors
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-3 space-y-2">
                  {parsedData.slice(0, 50).map((teacher) => (
                    <div
                      key={teacher.row}
                      className={`p-3 rounded-lg text-sm ${
                        teacher.isValid ? "bg-primary/5" : "bg-destructive/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">
                            Row {teacher.row}: {teacher.data.first_name} {teacher.data.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {teacher.data.employee_number} • {teacher.data.email}
                            {teacher.data.department && ` • ${teacher.data.department}`}
                          </div>
                        </div>
                        {teacher.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-destructive shrink-0" />
                        )}
                      </div>
                      {teacher.errors.length > 0 && (
                        <div className="mt-2 text-xs text-destructive">
                          {teacher.errors.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                  {parsedData.length > 50 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      ... and {parsedData.length - 50} more records
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Importing... {progress}%
              </p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium">Import Complete</p>
              <p className="text-sm text-muted-foreground">
                {results.success} imported successfully
                {results.failed > 0 && `, ${results.failed} failed`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0 || importing}>
              {importing ? "Importing..." : `Import ${validCount} Teachers`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
