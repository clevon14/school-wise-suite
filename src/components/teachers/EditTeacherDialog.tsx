import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner";

const editTeacherSchema = z.object({
  // Basic Information
  employee_number: z.string().trim().min(1, "Staff ID is required").max(50),
  role: z.string().trim().min(1, "Role is required"),
  designation: z.string().trim().optional(),
  department: z.string().trim().optional(),
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  father_name: z.string().trim().optional(),
  mother_name: z.string().trim().optional(),
  email: z.string().trim().email("Invalid email").max(255),
  gender: z.enum(["male", "female", "other"]).optional(),
  date_of_birth: z.string().optional(),
  hire_date: z.string().optional(),
  phone: z.string().trim().max(20).optional(),
  emergency_contact_number: z.string().trim().max(20).optional(),
  marital_status: z.string().trim().optional(),
  photo: z.instanceof(File).optional(),
  address: z.string().trim().max(500).optional(),
  permanent_address: z.string().trim().max(500).optional(),
  qualification: z.string().trim().optional(),
  work_experience: z.string().trim().optional(),
  note: z.string().trim().optional(),
  pan_number: z.string().trim().optional(),
  status: z.string().optional(),

  // Payroll
  epf_number: z.string().trim().optional(),
  basic_salary: z.string().optional(),
  contract_type: z.string().trim().optional(),
  work_shift: z.string().trim().optional(),
  work_location: z.string().trim().optional(),

  // Leaves
  medical_leave: z.string().optional(),
  casual_leave: z.string().optional(),
  maternity_leave: z.string().optional(),
  sick_leave: z.string().optional(),

  // Bank Account
  bank_account_title: z.string().trim().optional(),
  bank_account_number: z.string().trim().optional(),
  bank_name: z.string().trim().optional(),
  ifsc_code: z.string().trim().optional(),
  bank_branch_name: z.string().trim().optional(),

  // Documents
  resume: z.instanceof(File).optional(),
  joining_letter: z.instanceof(File).optional(),
  resignation_letter: z.instanceof(File).optional(),
  other_documents: z.instanceof(File).optional(),
});

type EditTeacherValues = z.infer<typeof editTeacherSchema>;

interface EditTeacherDialogProps {
  teacher: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const form = useForm<EditTeacherValues>({
    resolver: zodResolver(editTeacherSchema),
    values: {
      employee_number: teacher?.employee_number || "",
      role: teacher?.role || "teacher",
      designation: teacher?.designation || "",
      department: teacher?.department || "",
      first_name: teacher?.first_name || "",
      last_name: teacher?.last_name || "",
      father_name: teacher?.father_name || "",
      mother_name: teacher?.mother_name || "",
      email: teacher?.email || "",
      gender: teacher?.gender || undefined,
      date_of_birth: teacher?.date_of_birth || "",
      hire_date: teacher?.hire_date || "",
      phone: teacher?.phone || "",
      emergency_contact_number: teacher?.emergency_contact_number || "",
      marital_status: teacher?.marital_status || "",
      address: teacher?.address || "",
      permanent_address: teacher?.permanent_address || "",
      qualification: teacher?.qualification || "",
      work_experience: teacher?.work_experience || "",
      note: teacher?.note || "",
      pan_number: teacher?.pan_number || "",
      status: teacher?.status || "active",
      epf_number: teacher?.epf_number || "",
      basic_salary: teacher?.basic_salary ? String(teacher.basic_salary) : "",
      contract_type: teacher?.contract_type || "",
      work_shift: teacher?.work_shift || "",
      work_location: teacher?.work_location || "",
      medical_leave: teacher?.medical_leave != null ? String(teacher.medical_leave) : "",
      casual_leave: teacher?.casual_leave != null ? String(teacher.casual_leave) : "",
      maternity_leave: teacher?.maternity_leave != null ? String(teacher.maternity_leave) : "",
      sick_leave: teacher?.sick_leave != null ? String(teacher.sick_leave) : "",
      bank_account_title: teacher?.bank_account_title || "",
      bank_account_number: teacher?.bank_account_number || "",
      bank_name: teacher?.bank_name || "",
      ifsc_code: teacher?.ifsc_code || "",
      bank_branch_name: teacher?.bank_branch_name || "",
    },
  });

  const updateTeacher = useMutation({
    mutationFn: async (values: EditTeacherValues) => {
      setUploading(true);
      let photo_url = teacher?.photo_url || null;
      let resume_url = teacher?.resume_url || null;
      let joining_letter_url = teacher?.joining_letter_url || null;
      let resignation_letter_url = teacher?.resignation_letter_url || null;
      let other_documents_url = teacher?.other_documents_url || null;

      try {
        if (values.photo) {
          const fileExt = values.photo.name.split('.').pop();
          const fileName = `teachers/photos/${Date.now()}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, values.photo);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName);
          photo_url = publicUrl;
        }

        if (values.resume) {
          const fileExt = values.resume.name.split('.').pop();
          const fileName = `teachers/documents/resume-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, values.resume);
          if (uploadError) throw uploadError;
          const { data: signedUrlData } = await supabase.storage.from('documents').createSignedUrl(fileName, 31536000);
          resume_url = signedUrlData?.signedUrl || '';
        }

        if (values.joining_letter) {
          const fileExt = values.joining_letter.name.split('.').pop();
          const fileName = `teachers/documents/joining-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, values.joining_letter);
          if (uploadError) throw uploadError;
          const { data: signedUrlData } = await supabase.storage.from('documents').createSignedUrl(fileName, 31536000);
          joining_letter_url = signedUrlData?.signedUrl || '';
        }

        if (values.resignation_letter) {
          const fileExt = values.resignation_letter.name.split('.').pop();
          const fileName = `teachers/documents/resignation-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, values.resignation_letter);
          if (uploadError) throw uploadError;
          const { data: signedUrlData } = await supabase.storage.from('documents').createSignedUrl(fileName, 31536000);
          resignation_letter_url = signedUrlData?.signedUrl || '';
        }

        if (values.other_documents) {
          const fileExt = values.other_documents.name.split('.').pop();
          const fileName = `teachers/documents/other-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, values.other_documents);
          if (uploadError) throw uploadError;
          const { data: signedUrlData } = await supabase.storage.from('documents').createSignedUrl(fileName, 31536000);
          other_documents_url = signedUrlData?.signedUrl || '';
        }

        const { error } = await supabase
          .from("employees")
          .update({
            employee_number: values.employee_number,
            role: values.role,
            designation: values.designation || null,
            department: values.department || null,
            first_name: values.first_name,
            last_name: values.last_name,
            father_name: values.father_name || null,
            mother_name: values.mother_name || null,
            email: values.email,
            gender: values.gender || null,
            date_of_birth: values.date_of_birth || null,
            hire_date: values.hire_date || null,
            phone: values.phone || null,
            emergency_contact_number: values.emergency_contact_number || null,
            marital_status: values.marital_status || null,
            photo_url,
            address: values.address || null,
            permanent_address: values.permanent_address || null,
            qualification: values.qualification || null,
            work_experience: values.work_experience || null,
            note: values.note || null,
            pan_number: values.pan_number || null,
            status: values.status || "active",
            epf_number: values.epf_number || null,
            basic_salary: values.basic_salary ? parseFloat(values.basic_salary) : null,
            contract_type: values.contract_type || null,
            work_shift: values.work_shift || null,
            work_location: values.work_location || null,
            medical_leave: values.medical_leave ? parseInt(values.medical_leave) : 0,
            casual_leave: values.casual_leave ? parseInt(values.casual_leave) : 0,
            maternity_leave: values.maternity_leave ? parseInt(values.maternity_leave) : 0,
            sick_leave: values.sick_leave ? parseInt(values.sick_leave) : 0,
            bank_account_title: values.bank_account_title || null,
            bank_account_number: values.bank_account_number || null,
            bank_name: values.bank_name || null,
            ifsc_code: values.ifsc_code || null,
            bank_branch_name: values.bank_branch_name || null,
            resume_url,
            joining_letter_url,
            resignation_letter_url,
            other_documents_url,
          })
          .eq("id", teacher.id);

        if (error) throw error;
      } finally {
        setUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher updated successfully");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update teacher");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff</DialogTitle>
          <DialogDescription>
            Update details for {teacher?.first_name} {teacher?.last_name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => updateTeacher.mutate(v))} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold">Basic Information</h3>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="employee_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff ID *</FormLabel>
                    <FormControl><Input placeholder="EMP001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="head_teacher">Head Teacher</SelectItem>
                        <SelectItem value="principal">Principal</SelectItem>
                        <SelectItem value="vice_principal">Vice Principal</SelectItem>
                        <SelectItem value="counselor">Counselor</SelectItem>
                        <SelectItem value="admin">Admin Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="designation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="head">Head</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Social Studies">Social Studies</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl><Input placeholder="Enter first name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input placeholder="Enter last name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="father_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father Name</FormLabel>
                    <FormControl><Input placeholder="Enter father name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="mother_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother Name</FormLabel>
                    <FormControl><Input placeholder="Enter mother name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Login Username) *</FormLabel>
                    <FormControl><Input type="email" placeholder="email@school.edu" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="date_of_birth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Of Birth *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="hire_date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Of Joining</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="Enter phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="emergency_contact_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Number</FormLabel>
                    <FormControl><Input placeholder="Enter emergency contact" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="marital_status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="photo" render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Photo</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); }} {...field} className="text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Textarea placeholder="Enter current address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="permanent_address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permanent Address</FormLabel>
                    <FormControl><Textarea placeholder="Enter permanent address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="qualification" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification</FormLabel>
                    <FormControl><Input placeholder="B.Ed., M.A." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="work_experience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Experience</FormLabel>
                    <FormControl><Input placeholder="5 years" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="pan_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>PAN Number *</FormLabel>
                    <FormControl><Input placeholder="ABCDE1234F" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl><Textarea placeholder="Any additional notes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Payroll */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold">Payroll</h3>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="epf_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>EPF No.</FormLabel>
                    <FormControl><Input placeholder="Enter EPF number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="basic_salary" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Salary</FormLabel>
                    <FormControl><Input type="number" placeholder="Enter amount" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contract_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="temporary">Temporary</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="probation">Probation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="work_shift" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Shift</FormLabel>
                    <FormControl><Input placeholder="Morning/Evening" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="work_location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Location</FormLabel>
                    <FormControl><Input placeholder="Main Campus" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Leaves */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold">Leaves</h3>

              <div className="grid grid-cols-4 gap-4">
                <FormField control={form.control} name="medical_leave" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Leave</FormLabel>
                    <FormControl><Input type="number" placeholder="Number Of Leaves" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="casual_leave" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Casual Leave</FormLabel>
                    <FormControl><Input type="number" placeholder="Number Of Leaves" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="maternity_leave" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maternity Leave</FormLabel>
                    <FormControl><Input type="number" placeholder="Number Of Leaves" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sick_leave" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sick Leave</FormLabel>
                    <FormControl><Input type="number" placeholder="Number Of Leaves" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold">Bank Account Details</h3>

              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="bank_account_title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Title</FormLabel>
                    <FormControl><Input placeholder="Enter account title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bank_account_number" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Account Number</FormLabel>
                    <FormControl><Input placeholder="Enter account number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bank_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl><Input placeholder="Enter bank name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="ifsc_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel>IFSC Code</FormLabel>
                    <FormControl><Input placeholder="Enter IFSC code" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="bank_branch_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Branch Name</FormLabel>
                    <FormControl><Input placeholder="Enter branch name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Upload Documents */}
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold">Upload Documents</h3>

              <div className="grid grid-cols-2 gap-6">
                <FormField control={form.control} name="resume" render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>1. Resume {teacher?.resume_url && <span className="text-xs text-muted-foreground">(existing file uploaded)</span>}</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); }} {...field} className="hidden" id="edit-resume-upload" />
                        <label htmlFor="edit-resume-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Drag and drop a file here or click</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="joining_letter" render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>2. Joining Letter {teacher?.joining_letter_url && <span className="text-xs text-muted-foreground">(existing file uploaded)</span>}</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); }} {...field} className="hidden" id="edit-joining-upload" />
                        <label htmlFor="edit-joining-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Drag and drop a file here or click</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="resignation_letter" render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>3. Resignation Letter {teacher?.resignation_letter_url && <span className="text-xs text-muted-foreground">(existing file uploaded)</span>}</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); }} {...field} className="hidden" id="edit-resignation-upload" />
                        <label htmlFor="edit-resignation-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Drag and drop a file here or click</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="other_documents" render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>4. Other Documents {teacher?.other_documents_url && <span className="text-xs text-muted-foreground">(existing file uploaded)</span>}</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); }} {...field} className="hidden" id="edit-other-upload" />
                        <label htmlFor="edit-other-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Drag and drop a file here or click</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTeacher.isPending || uploading}>
                {uploading ? "Uploading..." : updateTeacher.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
