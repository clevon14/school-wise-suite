import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParsedStudent {
  row: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

const FIELD_MAPPINGS = [
  { key: "admission_number", label: "Admission No.", required: true },
  { key: "first_name", label: "Student Name", required: true },
  { key: "last_name", label: "Last Name", required: false },
  { key: "pen_number", label: "PEN No.", required: false },
  { key: "aadhar_number", label: "Student Aadhar", required: false },
  { key: "gender", label: "Gender (male/female/other)", required: true },
  { key: "date_of_birth", label: "Date of Birth (YYYY-MM-DD)", required: true },
  { key: "place_of_birth", label: "Place of Birth", required: false },
  { key: "village", label: "Village", required: false },
  { key: "taluka", label: "Taluka", required: false },
  { key: "district", label: "District", required: false },
  { key: "father_name", label: "Father's Name", required: false },
  { key: "father_living", label: "Father Living (yes/no)", required: false },
  { key: "father_aadhar", label: "Father's Aadhar", required: false },
  { key: "father_occupation", label: "Father's Occupation", required: false },
  { key: "father_qualification", label: "Father's Qualification", required: false },
  { key: "father_phone", label: "Father's Phone", required: false },
  { key: "mother_name", label: "Mother's Name", required: false },
  { key: "mother_living", label: "Mother Living (yes/no)", required: false },
  { key: "mother_aadhar", label: "Mother's Aadhar", required: false },
  { key: "mother_occupation", label: "Mother's Occupation", required: false },
  { key: "mother_qualification", label: "Mother's Qualification", required: false },
  { key: "mother_phone", label: "Mother's Phone", required: false },
  { key: "annual_income", label: "Annual Income", required: false },
  { key: "guardian_address", label: "Guardian Address", required: false },
  { key: "parent_phone", label: "Contact Phone", required: false },
  { key: "parent_email", label: "Email", required: false },
  { key: "nationality", label: "Nationality", required: false },
  { key: "religion", label: "Religion", required: false },
  { key: "caste", label: "Caste", required: false },
  { key: "category", label: "Category (General/OBC/SC/ST)", required: false },
  { key: "mother_tongue", label: "Mother Tongue", required: false },
  { key: "other_languages", label: "Other Languages", required: false },
  { key: "elder_brothers", label: "Elder Brothers", required: false },
  { key: "younger_brothers", label: "Younger Brothers", required: false },
  { key: "elder_sisters", label: "Elder Sisters", required: false },
  { key: "younger_sisters", label: "Younger Sisters", required: false },
  { key: "address", label: "Permanent Address", required: false },
  { key: "last_school_name", label: "Last School Name", required: false },
  { key: "last_school_standards", label: "Standards Covered", required: false },
  { key: "last_school_leaving_date", label: "Last School Leaving Date", required: false },
  { key: "slc_produced", label: "SLC Produced (yes/no)", required: false },
  { key: "slc_date", label: "SLC Date", required: false },
  { key: "admission_medium", label: "Medium (English/Kannada/Hindi)", required: false },
  { key: "enrollment_date", label: "Enrollment Date", required: false },
  { key: "roll_number", label: "Roll Number", required: false },
  { key: "blood_group", label: "Blood Group", required: false },
];

export function BulkStudentImport({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "complete">("upload");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [parsedStudents, setParsedStudents] = useState<ParsedStudent[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    return lines.map(line => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const validateStudent = (data: Record<string, string>, row: number): ParsedStudent => {
    const errors: string[] = [];

    // Required fields
    if (!data.admission_number?.trim()) {
      errors.push("Admission number is required");
    }
    if (!data.first_name?.trim()) {
      errors.push("Student name is required");
    }
    if (!data.gender?.trim() || !["male", "female", "other"].includes(data.gender.toLowerCase())) {
      errors.push("Gender must be male, female, or other");
    }
    if (!data.date_of_birth?.trim()) {
      errors.push("Date of birth is required");
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.date_of_birth)) {
        errors.push("Date of birth must be in YYYY-MM-DD format");
      }
    }

    // Optional date validations
    if (data.last_school_leaving_date?.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.last_school_leaving_date)) {
        errors.push("Last school leaving date must be in YYYY-MM-DD format");
      }
    }
    if (data.slc_date?.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.slc_date)) {
        errors.push("SLC date must be in YYYY-MM-DD format");
      }
    }
    if (data.enrollment_date?.trim()) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.enrollment_date)) {
        errors.push("Enrollment date must be in YYYY-MM-DD format");
      }
    }

    // Email validation
    if (data.parent_email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.parent_email)) {
        errors.push("Invalid email format");
      }
    }

    return {
      row,
      data,
      errors,
      isValid: errors.length === 0,
    };
  };

  // Convert Excel date serial number to YYYY-MM-DD format
  const excelDateToString = (excelDate: number | string): string => {
    if (typeof excelDate === 'string') return excelDate;
    if (typeof excelDate !== 'number' || isNaN(excelDate)) return '';
    
    // Excel dates are days since 1900-01-01 (with a bug for 1900 leap year)
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  };

  // Parse Excel file using xlsx library
  const parseExcel = (data: ArrayBuffer): string[][] => {
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to array of arrays, keeping raw values
    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { 
      header: 1,
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });
    
    return jsonData.map(row => 
      (row as any[]).map(cell => {
        if (cell === null || cell === undefined) return '';
        return String(cell).trim();
      })
    );
  };

  const processFileData = (rows: string[][]) => {
    if (rows.length < 2) {
      toast.error("File must have a header row and at least one data row");
      return;
    }

    const headers = rows[0].map(h => (h || '').toLowerCase().trim());
    const students: ParsedStudent[] = [];

    // Map headers to field keys
    const headerMap: Record<number, string> = {};
    headers.forEach((header, index) => {
      const mapping = FIELD_MAPPINGS.find(
        f => f.label.toLowerCase() === header || f.key.toLowerCase() === header
      );
      if (mapping) {
        headerMap[index] = mapping.key;
      }
    });

    // Parse each data row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(cell => !cell?.trim())) continue; // Skip empty rows

      const data: Record<string, string> = {};
      row.forEach((value, index) => {
        const fieldKey = headerMap[index];
        if (fieldKey) {
          data[fieldKey] = (value || '').trim();
        }
      });

      students.push(validateStudent(data, i + 1));
    }

    if (students.length === 0) {
      toast.error("No valid data rows found in the file");
      return;
    }

    setParsedStudents(students);
    setStep("preview");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      toast.error("Please upload a CSV or Excel (.xlsx, .xls) file");
      return;
    }

    if (isExcel) {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer;
          const rows = parseExcel(data);
          processFileData(rows);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          toast.error("Failed to parse Excel file. Please check the format.");
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = parseCSV(text);
          processFileData(rows);
        } catch (error) {
          console.error("Error parsing CSV file:", error);
          toast.error("Failed to parse CSV file. Please check the format.");
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
      };
      reader.readAsText(file);
    }
  };

  const importStudents = useMutation({
    mutationFn: async () => {
      const validStudents = parsedStudents.filter(s => s.isValid);
      let success = 0;
      let failed = 0;

      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        const data = student.data;

        try {
          const { error } = await supabase.from("students").insert({
            admission_number: data.admission_number,
            first_name: data.first_name,
            last_name: data.last_name || "",
            pen_number: data.pen_number || null,
            aadhar_number: data.aadhar_number || null,
            gender: data.gender?.toLowerCase() || "male",
            date_of_birth: data.date_of_birth,
            place_of_birth: data.place_of_birth || null,
            village: data.village || null,
            taluka: data.taluka || null,
            district: data.district || null,
            class_id: selectedClass,
            father_name: data.father_name || null,
            father_living: data.father_living?.toLowerCase() === "yes" || data.father_living?.toLowerCase() === "true",
            father_aadhar: data.father_aadhar || null,
            father_occupation: data.father_occupation || null,
            father_qualification: data.father_qualification || null,
            father_phone: data.father_phone || null,
            mother_name: data.mother_name || null,
            mother_living: data.mother_living?.toLowerCase() === "yes" || data.mother_living?.toLowerCase() === "true",
            mother_aadhar: data.mother_aadhar || null,
            mother_occupation: data.mother_occupation || null,
            mother_qualification: data.mother_qualification || null,
            mother_phone: data.mother_phone || null,
            annual_income: data.annual_income || null,
            guardian_address: data.guardian_address || null,
            parent_phone: data.parent_phone || null,
            parent_email: data.parent_email || null,
            nationality: data.nationality || "Indian",
            religion: data.religion || null,
            caste: data.caste || null,
            category: data.category || null,
            mother_tongue: data.mother_tongue || null,
            other_languages: data.other_languages || null,
            elder_brothers: parseInt(data.elder_brothers) || 0,
            younger_brothers: parseInt(data.younger_brothers) || 0,
            elder_sisters: parseInt(data.elder_sisters) || 0,
            younger_sisters: parseInt(data.younger_sisters) || 0,
            address: data.address || null,
            last_school_name: data.last_school_name || null,
            last_school_standards: data.last_school_standards || null,
            last_school_leaving_date: data.last_school_leaving_date || null,
            slc_produced: data.slc_produced?.toLowerCase() === "yes" || data.slc_produced?.toLowerCase() === "true",
            slc_date: data.slc_date || null,
            admission_medium: data.admission_medium || "English",
            enrollment_date: data.enrollment_date || new Date().toISOString().split('T')[0],
            roll_number: data.roll_number || null,
            blood_group: data.blood_group || null,
            status: "active",
          });

          if (error) {
            console.error("Insert error:", error);
            failed++;
          } else {
            success++;
          }
        } catch (err) {
          console.error("Error inserting student:", err);
          failed++;
        }

        setImportProgress(Math.round(((i + 1) / validStudents.length) * 100));
      }

      return { success, failed };
    },
    onSuccess: (results) => {
      setImportResults(results);
      setStep("complete");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-count"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Import failed");
      setStep("preview");
    },
  });

  const handleImport = () => {
    setStep("importing");
    setImportProgress(0);
    importStudents.mutate();
  };

  const downloadTemplate = (format: 'csv' | 'xlsx') => {
    const headers = FIELD_MAPPINGS.map(f => f.label);

    if (format === 'xlsx') {
      // Create Excel file with headers only
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);
      
      // Set column widths
      const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
      worksheet['!cols'] = colWidths;
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
      XLSX.writeFile(workbook, "student_import_template.xlsx");
    } else {
      // Create CSV file with headers only
      const csvContent = headers.join(",");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student_import_template.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const resetDialog = () => {
    setStep("upload");
    setParsedStudents([]);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validCount = parsedStudents.filter(s => s.isValid).length;
  const invalidCount = parsedStudents.filter(s => !s.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Student Import
          </DialogTitle>
          <DialogDescription>
            Import multiple students from CSV or Excel (.xlsx) files
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Step 1: Select Class</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class for import" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.section ? `- ${cls.section}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Step 2: Download Template</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button variant="outline" onClick={() => downloadTemplate('xlsx')} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Excel Template
                  </Button>
                  <Button variant="outline" onClick={() => downloadTemplate('csv')} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    CSV Template
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Step 3: Upload File</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">CSV or Excel (.xlsx, .xls) files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required fields:</strong> Admission No., Student Name, Gender, Date of Birth (YYYY-MM-DD format)
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "preview" && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={validCount > 0 ? "default" : "secondary"}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {validCount} Valid
              </Badge>
              <Badge variant={invalidCount > 0 ? "destructive" : "secondary"}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {invalidCount} Invalid
              </Badge>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={resetDialog}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead>Admission No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStudents.map((student, index) => (
                    <TableRow key={index} className={!student.isValid ? "bg-destructive/10" : ""}>
                      <TableCell>{student.row}</TableCell>
                      <TableCell>
                        {student.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.data.admission_number || "-"}</TableCell>
                      <TableCell>{student.data.first_name || "-"}</TableCell>
                      <TableCell className="capitalize">{student.data.gender || "-"}</TableCell>
                      <TableCell>{student.data.date_of_birth || "-"}</TableCell>
                      <TableCell className="text-sm text-destructive">
                        {student.errors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={resetDialog}>
                Upload Different File
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Students
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Importing Students...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we import the students
              </p>
            </div>
            <Progress value={importProgress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {importProgress}% Complete
            </p>
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 space-y-6">
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Import Complete!</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-primary">{importResults.success}</p>
                  <p className="text-sm text-muted-foreground">Successfully Imported</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-destructive">{importResults.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={resetDialog}>
                Import More
              </Button>
              <Button onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
