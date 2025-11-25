import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const studentSchema = z.object({
  admission_number: z.string().trim().min(1, "Admission number is required").max(50),
  roll_number: z.string().trim().max(50).optional(),
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  class_id: z.string().uuid("Please select a class"),
  category: z.string().trim().max(50).optional(),
  religion: z.string().trim().max(50).optional(),
  caste: z.string().trim().max(50).optional(),
  parent_phone: z.string().trim().max(20).optional(),
  parent_email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  enrollment_date: z.string().optional(),
  blood_group: z.string().trim().max(10).optional(),
  house: z.string().trim().max(50).optional(),
  height: z.string().trim().max(20).optional(),
  weight: z.string().trim().max(20).optional(),
  measurement_date: z.string().optional(),
  medical_history: z.string().trim().max(1000).optional(),
  parent_name: z.string().trim().max(200).optional(),
  address: z.string().trim().max(500).optional(),
  photo: z.instanceof(File).optional(),
  // Parent/Guardian details
  father_name: z.string().trim().max(200).optional(),
  father_phone: z.string().trim().max(20).optional(),
  father_occupation: z.string().trim().max(100).optional(),
  father_photo: z.instanceof(File).optional(),
  mother_name: z.string().trim().max(200).optional(),
  mother_phone: z.string().trim().max(20).optional(),
  mother_occupation: z.string().trim().max(100).optional(),
  mother_photo: z.instanceof(File).optional(),
  guardian_is: z.enum(["father", "mother", "other"]).optional(),
  guardian_relation: z.string().trim().max(100).optional(),
  guardian_occupation: z.string().trim().max(100).optional(),
  guardian_photo: z.instanceof(File).optional(),
  guardian_address: z.string().trim().max(500).optional(),
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
      roll_number: "",
      first_name: "",
      last_name: "",
      date_of_birth: "",
      gender: "male",
      class_id: "",
      category: "",
      religion: "",
      caste: "",
      parent_phone: "",
      parent_email: "",
      enrollment_date: new Date().toISOString().split('T')[0],
      blood_group: "",
      house: "",
      height: "",
      weight: "",
      measurement_date: new Date().toISOString().split('T')[0],
      medical_history: "",
      parent_name: "",
      address: "",
      father_name: "",
      father_phone: "",
      father_occupation: "",
      mother_name: "",
      mother_phone: "",
      mother_occupation: "",
      guardian_is: undefined,
      guardian_relation: "",
      guardian_occupation: "",
      guardian_address: "",
    },
  });

  const createStudent = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      let photo_url = null;
      let father_photo_url = null;
      let mother_photo_url = null;
      let guardian_photo_url = null;

      // Upload student photo if provided
      if (values.photo) {
        setUploading(true);
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
        setUploading(false);
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

      const { data, error } = await supabase
        .from("students")
        .insert([{
          admission_number: values.admission_number,
          roll_number: values.roll_number || null,
          first_name: values.first_name,
          last_name: values.last_name,
          date_of_birth: values.date_of_birth,
          gender: values.gender,
          class_id: values.class_id,
          category: values.category || null,
          religion: values.religion || null,
          caste: values.caste || null,
          parent_phone: values.parent_phone || null,
          parent_email: values.parent_email || null,
          enrollment_date: values.enrollment_date || null,
          blood_group: values.blood_group || null,
          house: values.house || null,
          height: values.height || null,
          weight: values.weight || null,
          measurement_date: values.measurement_date || null,
          medical_history: values.medical_history || null,
          parent_name: values.parent_name || null,
          address: values.address || null,
          photo_url,
          father_name: values.father_name || null,
          father_phone: values.father_phone || null,
          father_occupation: values.father_occupation || null,
          father_photo_url,
          mother_name: values.mother_name || null,
          mother_phone: values.mother_phone || null,
          mother_occupation: values.mother_occupation || null,
          mother_photo_url,
          guardian_is: values.guardian_is || null,
          guardian_relation: values.guardian_relation || null,
          guardian_occupation: values.guardian_occupation || null,
          guardian_photo_url,
          guardian_address: values.guardian_address || null,
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
      toast.success("Student added successfully");
      form.reset();
      setSelectedFees([]);
      setFeeAmounts({});
      setSelectedDiscounts([]);
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add student");
    },
  });

  const onSubmit = (values: StudentFormValues) => {
    createStudent.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Admission</DialogTitle>
          <DialogDescription>
            Enter complete student details for admission
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1: Admission No, Roll Number, Class, Section */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="admission_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission No *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter admission number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roll_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter roll number" {...field} />
                    </FormControl>
                    <FormMessage />
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
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes?.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Section</FormLabel>
                <FormControl>
                  <Input placeholder="Select" disabled value={classes?.find(c => c.id === form.watch("class_id"))?.section || ""} />
                </FormControl>
              </FormItem>
            </div>

            {/* Row 2: First Name, Last Name, Gender, Date Of Birth */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
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
                    <FormLabel>Date Of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Category, Religion, Caste, Mobile Number, Email */}
            <div className="grid grid-cols-5 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
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
                    <FormMessage />
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
                      <Input placeholder="Enter religion" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="Enter caste" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter mobile" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Admission Date, Student Photo, Blood Group, House */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="enrollment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Student Photo (100px X 100px)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                          {...field}
                          className="text-xs"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="house"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>House</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Red">Red</SelectItem>
                        <SelectItem value="Blue">Blue</SelectItem>
                        <SelectItem value="Green">Green</SelectItem>
                        <SelectItem value="Yellow">Yellow</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 5: Height, Weight, Measurement Date */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter height (cm)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter weight (kg)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measurement_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Medical History */}
            <FormField
              control={form.control}
              name="medical_history"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medical History</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter medical history details" 
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parent Guardian Detail Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-lg">Parent Guardian Detail</h4>
              
              {/* Father Details */}
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="father_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter father name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="father_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="father_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Father Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="father_photo"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Father Photo (100px X 100px)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                          {...field}
                          className="text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mother Details */}
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="mother_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter mother name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mother_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mother_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mother Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mother_photo"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Mother Photo (100px X 100px)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                          {...field}
                          className="text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Guardian Details */}
              <FormField
                control={form.control}
                name="guardian_is"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>If Guardian Is *</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="father"
                            checked={field.value === "father"}
                            onChange={() => field.onChange("father")}
                            className="w-4 h-4"
                          />
                          <span>Father</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="mother"
                            checked={field.value === "mother"}
                            onChange={() => field.onChange("mother")}
                            className="w-4 h-4"
                          />
                          <span>Mother</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="other"
                            checked={field.value === "other"}
                            onChange={() => field.onChange("other")}
                            className="w-4 h-4"
                          />
                          <span>Other</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="parent_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter guardian name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardian_relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Relation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter relation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardian_photo"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Guardian Photo (100px X 100px)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                          {...field}
                          className="text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="parent_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardian_occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter occupation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guardian_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Fields Section */}
            <div className="space-y-4 pt-2 border-t">
              <h4 className="font-medium">Student Address</h4>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fees Details Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-lg">Fees Details</h4>
              
              <div className="space-y-2">
                {feeCategories?.map((fee) => (
                  <div key={fee.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedFees.includes(fee.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFees([...selectedFees, fee.id]);
                          setFeeAmounts({...feeAmounts, [fee.id]: fee.amount});
                        } else {
                          setSelectedFees(selectedFees.filter(id => id !== fee.id));
                          const newAmounts = {...feeAmounts};
                          delete newAmounts[fee.id];
                          setFeeAmounts(newAmounts);
                        }
                      }}
                    />
                    <label className="text-sm font-medium cursor-pointer flex-1">
                      {fee.name}
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={feeAmounts[fee.id] || fee.amount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setFeeAmounts({...feeAmounts, [fee.id]: value});
                        }}
                        disabled={!selectedFees.includes(fee.id)}
                        className="w-32 h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <h5 className="font-medium mb-2">Fees Discount Details</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedDiscounts.includes('sibling-disc')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDiscounts([...selectedDiscounts, 'sibling-disc']);
                        } else {
                          setSelectedDiscounts(selectedDiscounts.filter(d => d !== 'sibling-disc'));
                        }
                      }}
                    />
                    <label className="text-sm cursor-pointer">
                      Sibling Discount - sibling-disc
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedDiscounts.includes('handicap-disc')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDiscounts([...selectedDiscounts, 'handicap-disc']);
                        } else {
                          setSelectedDiscounts(selectedDiscounts.filter(d => d !== 'handicap-disc'));
                        }
                      }}
                    />
                    <label className="text-sm cursor-pointer">
                      Handicapped Discount - handicap-disc
                    </label>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={selectedDiscounts.includes('cls-top-disc')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDiscounts([...selectedDiscounts, 'cls-top-disc']);
                        } else {
                          setSelectedDiscounts(selectedDiscounts.filter(d => d !== 'cls-top-disc'));
                        }
                      }}
                    />
                    <label className="text-sm cursor-pointer">
                      Class Topper Discount - cls-top-disc
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createStudent.isPending || uploading}>
                {uploading ? "Uploading..." : createStudent.isPending ? "Adding..." : "Add Student"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
