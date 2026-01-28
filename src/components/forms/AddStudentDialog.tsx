import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FormScanner } from "./FormScanner";

const studentSchema = z.object({
  // Basic Information
  admission_number: z.string().trim().min(1, "Admission number is required").max(50),
  pen_number: z.string().trim().max(50).optional(),
  first_name: z.string().trim().min(1, "Name is required").max(200),
  last_name: z.string().trim().max(100).optional(),
  aadhar_number: z.string().trim().max(20).optional(),
  gender: z.enum(["male", "female", "other"]),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  place_of_birth: z.string().trim().max(100).optional(),
  village: z.string().trim().max(100).optional(),
  taluka: z.string().trim().max(100).optional(),
  district: z.string().trim().max(100).optional(),
  
  // Father's Details
  father_name: z.string().trim().max(200).optional(),
  father_living: z.boolean().optional(),
  father_aadhar: z.string().trim().max(20).optional(),
  father_occupation: z.string().trim().max(100).optional(),
  father_qualification: z.string().trim().max(100).optional(),
  father_phone: z.string().trim().max(20).optional(),
  father_photo: z.instanceof(File).optional(),
  
  // Mother's Details
  mother_name: z.string().trim().max(200).optional(),
  mother_living: z.boolean().optional(),
  mother_aadhar: z.string().trim().max(20).optional(),
  mother_occupation: z.string().trim().max(100).optional(),
  mother_qualification: z.string().trim().max(100).optional(),
  mother_phone: z.string().trim().max(20).optional(),
  mother_photo: z.instanceof(File).optional(),
  
  // Income & Guardian
  annual_income: z.string().trim().max(50).optional(),
  guardian_address: z.string().trim().max(500).optional(),
  parent_phone: z.string().trim().max(20).optional(),
  parent_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  
  // Caste & Nationality
  nationality: z.string().trim().max(50).optional(),
  religion: z.string().trim().max(50).optional(),
  caste: z.string().trim().max(50).optional(),
  category: z.string().trim().max(50).optional(),
  
  // Languages
  mother_tongue: z.string().trim().max(50).optional(),
  other_languages: z.string().trim().max(200).optional(),
  
  // Siblings
  elder_brothers: z.number().min(0).optional(),
  younger_brothers: z.number().min(0).optional(),
  elder_sisters: z.number().min(0).optional(),
  younger_sisters: z.number().min(0).optional(),
  
  // Previous School
  address: z.string().trim().max(500).optional(),
  last_school_name: z.string().trim().max(200).optional(),
  last_school_standards: z.string().trim().max(100).optional(),
  last_school_leaving_date: z.string().optional(),
  slc_produced: z.boolean().optional(),
  slc_date: z.string().optional(),
  
  // Admission Details
  class_id: z.string().uuid("Please select a class"),
  admission_standard: z.string().trim().max(50).optional(),
  admission_medium: z.string().trim().max(50).optional(),
  enrollment_date: z.string().optional(),
  
  // Photo
  photo: z.instanceof(File).optional(),
  
  // Additional fields kept for compatibility
  roll_number: z.string().trim().max(50).optional(),
  blood_group: z.string().trim().max(10).optional(),
  house: z.string().trim().max(50).optional(),
  height: z.string().trim().max(20).optional(),
  weight: z.string().trim().max(20).optional(),
  measurement_date: z.string().optional(),
  medical_history: z.string().trim().max(1000).optional(),
  guardian_is: z.enum(["father", "mother", "other"]).optional(),
  guardian_relation: z.string().trim().max(100).optional(),
  guardian_occupation: z.string().trim().max(100).optional(),
  guardian_photo: z.instanceof(File).optional(),
  
  // Fees
  selected_fees: z.array(z.string()).optional(),
  selected_discounts: z.array(z.string()).optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export function AddStudentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFees, setSelectedFees] = useState<string[]>([]);
  const [feeAmounts, setFeeAmounts] = useState<Record<string, number>>({});
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
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

  const { data: feeCategories } = useQuery({
    queryKey: ["fee-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      admission_number: "",
      pen_number: "",
      first_name: "",
      last_name: "",
      aadhar_number: "",
      gender: "male",
      date_of_birth: "",
      place_of_birth: "",
      village: "",
      taluka: "",
      district: "",
      father_name: "",
      father_living: true,
      father_aadhar: "",
      father_occupation: "",
      father_qualification: "",
      father_phone: "",
      mother_name: "",
      mother_living: true,
      mother_aadhar: "",
      mother_occupation: "",
      mother_qualification: "",
      mother_phone: "",
      annual_income: "",
      guardian_address: "",
      parent_phone: "",
      parent_email: "",
      nationality: "Indian",
      religion: "",
      caste: "",
      category: "",
      mother_tongue: "",
      other_languages: "",
      elder_brothers: 0,
      younger_brothers: 0,
      elder_sisters: 0,
      younger_sisters: 0,
      address: "",
      last_school_name: "",
      last_school_standards: "",
      last_school_leaving_date: "",
      slc_produced: false,
      slc_date: "",
      class_id: "",
      admission_standard: "",
      admission_medium: "English",
      enrollment_date: new Date().toISOString().split('T')[0],
      roll_number: "",
      blood_group: "",
      house: "",
      height: "",
      weight: "",
      measurement_date: new Date().toISOString().split('T')[0],
      medical_history: "",
      guardian_is: undefined,
      guardian_relation: "",
      guardian_occupation: "",
    },
  });

  const createStudent = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      let photo_url = null;
      let father_photo_url = null;
      let mother_photo_url = null;
      let guardian_photo_url = null;

      setUploading(true);

      // Upload student photo if provided
      if (values.photo) {
        const fileExt = values.photo.name.split('.').pop();
        const fileName = `students/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, values.photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(fileName);
        
        photo_url = publicUrl;
      }

      // Upload father photo if provided
      if (values.father_photo) {
        const fileExt = values.father_photo.name.split('.').pop();
        const fileName = `parents/father-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, values.father_photo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
        father_photo_url = publicUrl;
      }

      // Upload mother photo if provided
      if (values.mother_photo) {
        const fileExt = values.mother_photo.name.split('.').pop();
        const fileName = `parents/mother-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, values.mother_photo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
        mother_photo_url = publicUrl;
      }

      // Upload guardian photo if provided
      if (values.guardian_photo) {
        const fileExt = values.guardian_photo.name.split('.').pop();
        const fileName = `parents/guardian-${Date.now()}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, values.guardian_photo);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
        guardian_photo_url = publicUrl;
      }

      setUploading(false);

      const { data, error } = await supabase
        .from("students")
        .insert([{
          admission_number: values.admission_number,
          pen_number: values.pen_number || null,
          first_name: values.first_name,
          last_name: values.last_name || "",
          aadhar_number: values.aadhar_number || null,
          gender: values.gender,
          date_of_birth: values.date_of_birth,
          place_of_birth: values.place_of_birth || null,
          village: values.village || null,
          taluka: values.taluka || null,
          district: values.district || null,
          father_name: values.father_name || null,
          father_living: values.father_living,
          father_aadhar: values.father_aadhar || null,
          father_occupation: values.father_occupation || null,
          father_qualification: values.father_qualification || null,
          father_phone: values.father_phone || null,
          father_photo_url,
          mother_name: values.mother_name || null,
          mother_living: values.mother_living,
          mother_aadhar: values.mother_aadhar || null,
          mother_occupation: values.mother_occupation || null,
          mother_qualification: values.mother_qualification || null,
          mother_phone: values.mother_phone || null,
          mother_photo_url,
          annual_income: values.annual_income || null,
          guardian_address: values.guardian_address || null,
          parent_phone: values.parent_phone || null,
          parent_email: values.parent_email || null,
          nationality: values.nationality || null,
          religion: values.religion || null,
          caste: values.caste || null,
          category: values.category || null,
          mother_tongue: values.mother_tongue || null,
          other_languages: values.other_languages || null,
          elder_brothers: values.elder_brothers || 0,
          younger_brothers: values.younger_brothers || 0,
          elder_sisters: values.elder_sisters || 0,
          younger_sisters: values.younger_sisters || 0,
          address: values.address || null,
          last_school_name: values.last_school_name || null,
          last_school_standards: values.last_school_standards || null,
          last_school_leaving_date: values.last_school_leaving_date || null,
          slc_produced: values.slc_produced || false,
          slc_date: values.slc_date || null,
          class_id: values.class_id,
          admission_standard: values.admission_standard || null,
          admission_medium: values.admission_medium || null,
          enrollment_date: values.enrollment_date || null,
          photo_url,
          roll_number: values.roll_number || null,
          blood_group: values.blood_group || null,
          house: values.house || null,
          height: values.height || null,
          weight: values.weight || null,
          measurement_date: values.measurement_date || null,
          medical_history: values.medical_history || null,
          guardian_is: values.guardian_is || null,
          guardian_relation: values.guardian_relation || null,
          guardian_occupation: values.guardian_occupation || null,
          guardian_photo_url,
          status: "active",
        }])
        .select()
        .single();

      if (error) throw error;

      // Create fee assignments for selected fees
      if (selectedFees.length > 0) {
        const feeAssignments = selectedFees.map(feeCategoryId => ({
          student_id: data.id,
          fee_category_id: feeCategoryId,
          amount: feeAmounts[feeCategoryId] || feeCategories?.find(f => f.id === feeCategoryId)?.amount || 0,
          due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
          status: 'pending'
        }));

        const { error: feeError } = await supabase
          .from("fee_assignments")
          .insert(feeAssignments);

        if (feeError) throw feeError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-count"] });
      toast.success("Student admitted successfully");
      form.reset();
      setSelectedFees([]);
      setFeeAmounts({});
      setSelectedDiscounts([]);
      setOpen(false);
    },
    onError: (error: any) => {
      setUploading(false);
      toast.error(error.message || "Failed to admit student");
    },
  });

  const onSubmit = (values: StudentFormValues) => {
    createStudent.mutate(values);
  };

  // Handle data extracted from form scanner
  const handleScannedData = (data: any) => {
    setShowScanner(false);
    
    // Map extracted data to form fields
    if (data.student) {
      if (data.student.first_name) form.setValue("first_name", data.student.first_name);
      if (data.student.last_name) form.setValue("last_name", data.student.last_name);
      if (data.student.admission_number) form.setValue("admission_number", data.student.admission_number);
      if (data.student.pen_number) form.setValue("pen_number", data.student.pen_number);
      if (data.student.aadhar_number) form.setValue("aadhar_number", data.student.aadhar_number);
      if (data.student.gender) form.setValue("gender", data.student.gender);
      if (data.student.date_of_birth) form.setValue("date_of_birth", data.student.date_of_birth);
      if (data.student.place_of_birth) form.setValue("place_of_birth", data.student.place_of_birth);
      if (data.student.village) form.setValue("village", data.student.village);
      if (data.student.taluka) form.setValue("taluka", data.student.taluka);
      if (data.student.district) form.setValue("district", data.student.district);
    }

    if (data.father) {
      if (data.father.name) form.setValue("father_name", data.father.name);
      if (data.father.living !== null) form.setValue("father_living", data.father.living);
      if (data.father.aadhar) form.setValue("father_aadhar", data.father.aadhar);
      if (data.father.occupation) form.setValue("father_occupation", data.father.occupation);
      if (data.father.qualification) form.setValue("father_qualification", data.father.qualification);
      if (data.father.phone) form.setValue("father_phone", data.father.phone);
    }

    if (data.mother) {
      if (data.mother.name) form.setValue("mother_name", data.mother.name);
      if (data.mother.living !== null) form.setValue("mother_living", data.mother.living);
      if (data.mother.aadhar) form.setValue("mother_aadhar", data.mother.aadhar);
      if (data.mother.occupation) form.setValue("mother_occupation", data.mother.occupation);
      if (data.mother.qualification) form.setValue("mother_qualification", data.mother.qualification);
      if (data.mother.phone) form.setValue("mother_phone", data.mother.phone);
    }

    if (data.family) {
      if (data.family.annual_income) form.setValue("annual_income", data.family.annual_income);
      if (data.family.guardian_address) form.setValue("guardian_address", data.family.guardian_address);
      if (data.family.parent_phone) form.setValue("parent_phone", data.family.parent_phone);
      if (data.family.parent_email) form.setValue("parent_email", data.family.parent_email);
      if (data.family.nationality) form.setValue("nationality", data.family.nationality);
      if (data.family.religion) form.setValue("religion", data.family.religion);
      if (data.family.caste) form.setValue("caste", data.family.caste);
      if (data.family.category) form.setValue("category", data.family.category);
      if (data.family.mother_tongue) form.setValue("mother_tongue", data.family.mother_tongue);
      if (data.family.other_languages) form.setValue("other_languages", data.family.other_languages);
      if (data.family.elder_brothers !== null) form.setValue("elder_brothers", data.family.elder_brothers);
      if (data.family.younger_brothers !== null) form.setValue("younger_brothers", data.family.younger_brothers);
      if (data.family.elder_sisters !== null) form.setValue("elder_sisters", data.family.elder_sisters);
      if (data.family.younger_sisters !== null) form.setValue("younger_sisters", data.family.younger_sisters);
    }

    if (data.previous_school) {
      if (data.previous_school.name) form.setValue("last_school_name", data.previous_school.name);
      if (data.previous_school.standards_attended) form.setValue("last_school_standards", data.previous_school.standards_attended);
      if (data.previous_school.leaving_date) form.setValue("last_school_leaving_date", data.previous_school.leaving_date);
      if (data.previous_school.slc_produced !== null) form.setValue("slc_produced", data.previous_school.slc_produced);
      if (data.previous_school.slc_date) form.setValue("slc_date", data.previous_school.slc_date);
    }

    if (data.admission) {
      if (data.admission.standard) form.setValue("admission_standard", data.admission.standard);
      if (data.admission.medium) form.setValue("admission_medium", data.admission.medium);
    }

    // Show confidence notification
    if (data.confidence) {
      const confidenceLevel = data.confidence.overall;
      if (confidenceLevel === "low") {
        toast.warning("Low confidence extraction - please review all fields carefully", {
          description: data.confidence.notes,
          duration: 6000,
        });
      } else if (confidenceLevel === "medium") {
        toast.info("Form data extracted - please verify the information", {
          duration: 4000,
        });
      } else {
        toast.success("Form data extracted successfully", {
          duration: 3000,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center border-b pb-4">
          <DialogTitle className="text-xl font-bold">GULBARGA DIOCESE EDUCATION SOCIETY</DialogTitle>
          <DialogDescription className="text-lg font-semibold">
            HOLY CROSS ENGLISH MEDIUM SCHOOL<br />
            <span className="text-sm font-normal">SANTHPUR, AURAD TQ. BIDAR-585421</span>
          </DialogDescription>
          <h3 className="text-lg font-bold mt-2 text-foreground">APPLICATION FOR ADMISSION</h3>
        </DialogHeader>

        {showScanner ? (
          <div className="py-4">
            <FormScanner 
              onDataExtracted={handleScannedData} 
              onClose={() => setShowScanner(false)} 
            />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              
              {/* Scan Form Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="gap-2 border-dashed border-2"
                >
                  <ScanLine className="h-4 w-4" />
                  Scan Handwritten Form
                </Button>
              </div>

              {/* Section 1: Basic Student Information */}
              <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Student Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  {/* Photo Upload */}
                  <div className="col-span-3 flex flex-col items-center justify-start">
                    <FormField
                      control={form.control}
                      name="photo"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <div className="flex flex-col items-center">
                              <label className="w-24 h-28 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-muted/50">
                                {value ? (
                                  <img src={URL.createObjectURL(value)} alt="Preview" className="w-full h-full object-cover rounded" />
                                ) : (
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => onChange(e.target.files?.[0])}
                                  {...field}
                                />
                              </label>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Basic Info Fields */}
                  <div className="col-span-9 grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="admission_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission No. *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter admission number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pen_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PEN No.</FormLabel>
                          <FormControl>
                            <Input placeholder="E308" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes?.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name} {cls.section ? `- ${cls.section}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Name of the Pupil (Block Letters) *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} className="uppercase" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aadhar_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pupil Aadhar No.</FormLabel>
                          <FormControl>
                            <Input placeholder="12 digit Aadhar" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Boy or Girl *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Boy</SelectItem>
                            <SelectItem value="female">Girl</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="place_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Place of Birth</FormLabel>
                        <FormControl>
                          <Input placeholder="Village/Town" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="village"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Village</FormLabel>
                        <FormControl>
                          <Input placeholder="Village name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="taluka"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taluka</FormLabel>
                        <FormControl>
                          <Input placeholder="Taluka" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District</FormLabel>
                        <FormControl>
                          <Input placeholder="District" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enrollment_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Admission</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Father's Details */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Father's Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="father_name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Father's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter father's name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="father_living"
                    render={({ field }) => (
                      <FormItem className="flex items-end space-x-2 pb-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Living</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="father_aadhar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Father's Aadhar No.</FormLabel>
                        <FormControl>
                          <Input placeholder="12 digit Aadhar" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="father_occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Occupation" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="father_qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input placeholder="Education" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="father_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="father_photo"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files?.[0])}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Mother's Details */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Mother's Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="mother_name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Mother's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter mother's name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mother_living"
                    render={({ field }) => (
                      <FormItem className="flex items-end space-x-2 pb-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Living</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mother_aadhar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother's Aadhar No.</FormLabel>
                        <FormControl>
                          <Input placeholder="12 digit Aadhar" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="mother_occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Occupation" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mother_qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input placeholder="Education" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mother_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Mobile number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mother_photo"
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormLabel>Photo</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files?.[0])}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Guardian & Income */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Guardian & Income Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="annual_income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent's Annual Income</FormLabel>
                        <FormControl>
                          <Input placeholder="Annual income" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact No.</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact number" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="guardian_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian's Name and Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter guardian's name and full address" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Section 5: Nationality & Caste */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Nationality, Religion and Caste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <FormControl>
                          <Input placeholder="Indian" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="religion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Religion</FormLabel>
                        <FormControl>
                          <Input placeholder="Religion" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caste"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caste</FormLabel>
                        <FormControl>
                          <Input placeholder="Caste" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SC/ST/OBC</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="OBC">OBC</SelectItem>
                            <SelectItem value="SC">SC</SelectItem>
                            <SelectItem value="ST">ST</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 6: Languages */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mother_tongue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mother Tongue</FormLabel>
                        <FormControl>
                          <Input placeholder="Mother tongue" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="other_languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Any Other Languages Spoken</FormLabel>
                        <FormControl>
                          <Input placeholder="Other languages" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 7: Siblings */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Siblings Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="elder_brothers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Elder Brothers</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="younger_brothers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Younger Brothers</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="elder_sisters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Elder Sisters</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="younger_sisters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Younger Sisters</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 8: Previous School */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Previous School Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permanent Address of Pupil</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter permanent address" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="last_school_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last School Attended</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of school" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_school_standards"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standards Covered</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1-5" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_school_leaving_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Leaving</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="slc_produced"
                    render={({ field }) => (
                      <FormItem className="flex items-end space-x-2 pb-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">School Leaving Certificate Produced</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slc_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SLC Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="admission_medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medium</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Kannada">Kannada</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 9: Fee Assignment */}
            {feeCategories && feeCategories.length > 0 && (
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Fee Assignment (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {feeCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2 p-2 border rounded">
                        <Checkbox
                          checked={selectedFees.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFees([...selectedFees, category.id]);
                              setFeeAmounts({ ...feeAmounts, [category.id]: category.amount || 0 });
                            } else {
                              setSelectedFees(selectedFees.filter(id => id !== category.id));
                              const newAmounts = { ...feeAmounts };
                              delete newAmounts[category.id];
                              setFeeAmounts(newAmounts);
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">₹{category.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createStudent.isPending || uploading}>
                {uploading ? "Uploading..." : createStudent.isPending ? "Submitting..." : "Submit Admission"}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
