import { useState, useRef } from "react";
import { Camera, Upload, FileImage, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ExtractedStaffData {
  basic: {
    employee_number: string | null;
    first_name: string | null;
    last_name: string | null;
    father_name: string | null;
    mother_name: string | null;
    email: string | null;
    gender: "male" | "female" | "other" | null;
    date_of_birth: string | null;
    hire_date: string | null;
    phone: string | null;
    emergency_contact_number: string | null;
    marital_status: string | null;
    role: string | null;
    designation: string | null;
    department: string | null;
  };
  address: {
    current_address: string | null;
    permanent_address: string | null;
  };
  qualifications: {
    qualification: string | null;
    work_experience: string | null;
    pan_number: string | null;
    note: string | null;
  };
  payroll: {
    epf_number: string | null;
    basic_salary: number | null;
    contract_type: string | null;
    work_shift: string | null;
    work_location: string | null;
  };
  leaves: {
    medical_leave: number | null;
    casual_leave: number | null;
    maternity_leave: number | null;
    sick_leave: number | null;
  };
  bank: {
    account_title: string | null;
    account_number: string | null;
    bank_name: string | null;
    ifsc_code: string | null;
    branch_name: string | null;
  };
  confidence: {
    overall: "high" | "medium" | "low";
    notes: string;
  };
}

interface StaffFormScannerProps {
  onDataExtracted: (data: ExtractedStaffData) => void;
  onClose: () => void;
}

export function StaffFormScanner({ onDataExtracted, onClose }: StaffFormScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async () => {
    if (!imagePreview) return;

    setIsProcessing(true);
    setProgress(10);
    setError(null);

    try {
      // Simulate progress while waiting
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 85));
      }, 500);

      const { data, error: fnError } = await supabase.functions.invoke("scan-staff-form", {
        body: { image: imagePreview },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (fnError) {
        throw new Error(fnError.message || "Failed to scan form");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success || !data?.data) {
        throw new Error("No data extracted from image");
      }

      toast.success("Staff form scanned successfully!");
      onDataExtracted(data.data);
    } catch (err) {
      console.error("Scan error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process image";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Scan Staff Registration Form</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!imagePreview ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <FileImage className="h-16 w-16 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Upload a photo or scan of the handwritten staff registration form
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border bg-muted">
            <img
              src={imagePreview}
              alt="Form preview"
              className="w-full max-h-[400px] object-contain"
            />
            {!isProcessing && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing handwriting with AI...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Scan Failed</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={clearImage}
              disabled={isProcessing}
              className="flex-1"
            >
              Choose Different Image
            </Button>
            <Button
              onClick={processImage}
              disabled={isProcessing}
              className="flex-1 gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 Tips for best results:</p>
        <ul className="list-disc list-inside pl-2 space-y-0.5">
          <li>Ensure good lighting and a clear, flat surface</li>
          <li>Capture the entire form in the frame</li>
          <li>Avoid shadows and glare on the paper</li>
          <li>Always review extracted data before submitting</li>
        </ul>
      </div>
    </div>
  );
}
