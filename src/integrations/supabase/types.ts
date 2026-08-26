export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          remarks: string | null
          school_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          status: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bus_routes: {
        Row: {
          bus_id: string
          created_at: string | null
          drop_time: string
          id: string
          monthly_fee: number
          pickup_time: string
          route_name: string
          route_number: string
          school_id: string | null
          updated_at: string | null
          village: string | null
        }
        Insert: {
          bus_id: string
          created_at?: string | null
          drop_time: string
          id?: string
          monthly_fee: number
          pickup_time: string
          route_name: string
          route_number: string
          school_id?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Update: {
          bus_id?: string
          created_at?: string | null
          drop_time?: string
          id?: string
          monthly_fee?: number
          pickup_time?: string
          route_name?: string
          route_number?: string
          school_id?: string | null
          updated_at?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_routes_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bus_routes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_stops: {
        Row: {
          created_at: string | null
          drop_time: string
          id: string
          pickup_time: string
          route_id: string
          sequence_order: number
          stop_address: string | null
          stop_name: string
        }
        Insert: {
          created_at?: string | null
          drop_time: string
          id?: string
          pickup_time: string
          route_id: string
          sequence_order: number
          stop_address?: string | null
          stop_name: string
        }
        Update: {
          created_at?: string | null
          drop_time?: string
          id?: string
          pickup_time?: string
          route_id?: string
          sequence_order?: number
          stop_address?: string | null
          stop_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          bus_number: string
          capacity: number
          conductor_name: string | null
          conductor_phone: string | null
          created_at: string | null
          driver_name: string
          driver_phone: string
          id: string
          school_id: string | null
          status: string
          updated_at: string | null
          vehicle_number: string
        }
        Insert: {
          bus_number: string
          capacity: number
          conductor_name?: string | null
          conductor_phone?: string | null
          created_at?: string | null
          driver_name: string
          driver_phone: string
          id?: string
          school_id?: string | null
          status?: string
          updated_at?: string | null
          vehicle_number: string
        }
        Update: {
          bus_number?: string
          capacity?: number
          conductor_name?: string | null
          conductor_phone?: string | null
          created_at?: string | null
          driver_name?: string
          driver_phone?: string
          id?: string
          school_id?: string | null
          status?: string
          updated_at?: string | null
          vehicle_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "buses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_fee_structure: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          id: string
          lab_fee: number | null
          library_fee: number | null
          other_fees: number | null
          school_id: string | null
          sports_fee: number | null
          tuition_fee: number
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string | null
          id?: string
          lab_fee?: number | null
          library_fee?: number | null
          other_fees?: number | null
          school_id?: string | null
          sports_fee?: number | null
          tuition_fee: number
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          id?: string
          lab_fee?: number | null
          library_fee?: number | null
          other_fees?: number | null
          school_id?: string | null
          sports_fee?: number | null
          tuition_fee?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_fee_structure_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_fee_structure_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          subject_id: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          subject_id: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          subject_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          created_at: string | null
          id: string
          name: string
          school_id: string | null
          section: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          id?: string
          name: string
          school_id?: string | null
          section?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string | null
          section?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_type: string | null
          id: string
          metadata: Json | null
          name: string
          owner_id: string | null
          school_id: string | null
          size: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_type?: string | null
          id?: string
          metadata?: Json | null
          name: string
          owner_id?: string | null
          school_id?: string | null
          size?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_type?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          owner_id?: string | null
          school_id?: string | null
          size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_attendance: {
        Row: {
          created_at: string | null
          date: string
          employee_id: string
          id: string
          marked_by: string | null
          remarks: string | null
          school_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          created_at: string | null
          date_of_birth: string | null
          department: string | null
          email: string
          employee_number: string
          first_name: string
          gender: string | null
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          role: string | null
          school_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email: string
          employee_number: string
          first_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          role?: string | null
          school_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          department?: string | null
          email?: string
          employee_number?: string
          first_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          role?: string | null
          school_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          exam_date: string
          exam_id: string
          id: string
          max_marks: number
          pass_marks: number
          school_id: string | null
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          exam_date: string
          exam_id: string
          id?: string
          max_marks: number
          pass_marks: number
          school_id?: string | null
          subject_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          exam_date?: string
          exam_id?: string
          id?: string
          max_marks?: number
          pass_marks?: number
          school_id?: string | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string
          class_id: string | null
          created_at: string | null
          end_date: string
          exam_type: string
          id: string
          name: string
          passing_marks: number | null
          school_id: string | null
          start_date: string
          total_marks: number | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_id?: string | null
          created_at?: string | null
          end_date: string
          exam_type: string
          id?: string
          name: string
          passing_marks?: number | null
          school_id?: string | null
          start_date: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string | null
          created_at?: string | null
          end_date?: string
          exam_type?: string
          id?: string
          name?: string
          passing_marks?: number | null
          school_id?: string | null
          start_date?: string
          total_marks?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_assignments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          fee_category_id: string
          id: string
          school_id: string | null
          status: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          fee_category_id: string
          id?: string
          school_id?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          fee_category_id?: string
          id?: string
          school_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_assignments_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          academic_year: string
          amount: number
          created_at: string | null
          description: string | null
          frequency: string
          id: string
          is_mandatory: boolean | null
          name: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          amount: number
          created_at?: string | null
          description?: string | null
          frequency: string
          id?: string
          is_mandatory?: boolean | null
          name: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          amount?: number
          created_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_mandatory?: boolean | null
          name?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          school_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          school_id?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          school_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          created_at: string | null
          entered_by: string | null
          exam_subject_id: string
          id: string
          is_absent: boolean | null
          marks_obtained: number | null
          remarks: string | null
          school_id: string | null
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entered_by?: string | null
          exam_subject_id: string
          id?: string
          is_absent?: boolean | null
          marks_obtained?: number | null
          remarks?: string | null
          school_id?: string | null
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entered_by?: string | null
          exam_subject_id?: string
          id?: string
          is_absent?: boolean | null
          marks_obtained?: number | null
          remarks?: string | null
          school_id?: string | null
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marks_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_exam_subject_id_fkey"
            columns: ["exam_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_email: boolean | null
          is_push: boolean | null
          is_sms: boolean | null
          message: string
          notification_type: string
          priority: string
          sent_at: string | null
          sent_by: string
          target_class_id: string | null
          target_role: string[] | null
          target_student_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_email?: boolean | null
          is_push?: boolean | null
          is_sms?: boolean | null
          message: string
          notification_type: string
          priority?: string
          sent_at?: string | null
          sent_by: string
          target_class_id?: string | null
          target_role?: string[] | null
          target_student_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_email?: boolean | null
          is_push?: boolean | null
          is_sms?: boolean | null
          message?: string
          notification_type?: string
          priority?: string
          sent_at?: string | null
          sent_by?: string
          target_class_id?: string | null
          target_role?: string[] | null
          target_student_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_target_student_id_fkey"
            columns: ["target_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string | null
          fee_assignment_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string
          school_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          collected_by?: string | null
          created_at?: string | null
          fee_assignment_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          receipt_number: string
          school_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string | null
          fee_assignment_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          school_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_fee_assignment_id_fkey"
            columns: ["fee_assignment_id"]
            isOneToOne: false
            referencedRelation: "fee_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotion_history: {
        Row: {
          academic_year: string
          created_at: string | null
          from_class_id: string | null
          id: string
          promotion_date: string | null
          student_id: string
          to_class_id: string | null
        }
        Insert: {
          academic_year: string
          created_at?: string | null
          from_class_id?: string | null
          id?: string
          promotion_date?: string | null
          student_id: string
          to_class_id?: string | null
        }
        Update: {
          academic_year?: string
          created_at?: string | null
          from_class_id?: string | null
          id?: string
          promotion_date?: string | null
          student_id?: string
          to_class_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_history_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answer_text: string | null
          attempt_id: string
          created_at: string | null
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
        }
        Insert: {
          answer_text?: string | null
          attempt_id: string
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
        }
        Update: {
          answer_text?: string | null
          attempt_id?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string | null
          id: string
          is_graded: boolean | null
          marks_obtained: number | null
          quiz_id: string
          started_at: string | null
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_graded?: boolean | null
          marks_obtained?: number | null
          quiz_id: string
          started_at?: string | null
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_graded?: boolean | null
          marks_obtained?: number | null
          quiz_id?: string
          started_at?: string | null
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string | null
          created_at: string | null
          id: string
          marks: number
          options: Json | null
          question_text: string
          question_type: string
          quiz_id: string
          sequence_order: number
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          marks: number
          options?: Json | null
          question_text: string
          question_type: string
          quiz_id: string
          sequence_order: number
        }
        Update: {
          correct_answer?: string | null
          created_at?: string | null
          id?: string
          marks?: number
          options?: Json | null
          question_text?: string
          question_type?: string
          quiz_id?: string
          sequence_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          class_id: string
          created_at: string | null
          duration_minutes: number
          id: string
          is_published: boolean | null
          quiz_type: string
          scheduled_date: string | null
          school_id: string | null
          subject_id: string
          teacher_id: string
          title: string
          total_marks: number
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          duration_minutes: number
          id?: string
          is_published?: boolean | null
          quiz_type: string
          scheduled_date?: string | null
          school_id?: string | null
          subject_id: string
          teacher_id: string
          title: string
          total_marks: number
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          duration_minutes?: number
          id?: string
          is_published?: boolean | null
          quiz_type?: string
          scheduled_date?: string | null
          school_id?: string | null
          subject_id?: string
          teacher_id?: string
          title?: string
          total_marks?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      school_events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          location: string | null
          school_id: string | null
          start_time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          location?: string | null
          school_id?: string | null
          start_time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          location?: string | null
          school_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_year: string | null
          accent_color: string | null
          address: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          status: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          accent_color?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          accent_color?: string | null
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          status?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_transport: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          route_id: string
          start_date: string
          status: string
          stop_id: string
          student_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          route_id: string
          start_date?: string
          status?: string
          stop_id: string
          student_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          route_id?: string
          start_date?: string
          status?: string
          stop_id?: string
          student_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "bus_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_number: string
          class_id: string | null
          created_at: string | null
          date_of_birth: string | null
          enrollment_date: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          school_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          village: string | null
        }
        Insert: {
          address?: string | null
          admission_number: string
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          enrollment_date?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          school_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          village?: string | null
        }
        Update: {
          address?: string | null
          admission_number?: string
          class_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          enrollment_date?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          school_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_progress: {
        Row: {
          completion_date: string | null
          created_at: string | null
          hours_taught: number | null
          id: string
          notes: string | null
          school_id: string | null
          status: string
          syllabus_topic_id: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          hours_taught?: number | null
          id?: string
          notes?: string | null
          school_id?: string | null
          status?: string
          syllabus_topic_id: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          hours_taught?: number | null
          id?: string
          notes?: string | null
          school_id?: string | null
          status?: string
          syllabus_topic_id?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_progress_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_syllabus_topic_id_fkey"
            columns: ["syllabus_topic_id"]
            isOneToOne: false
            referencedRelation: "syllabus_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_progress_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_topics: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          description: string | null
          id: string
          planned_hours: number | null
          school_id: string | null
          sequence_order: number | null
          subject_id: string
          term: string | null
          topic_name: string
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          planned_hours?: number | null
          school_id?: string | null
          sequence_order?: number | null
          subject_id: string
          term?: string | null
          topic_name: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          planned_hours?: number | null
          school_id?: string | null
          sequence_order?: number | null
          subject_id?: string
          term?: string | null
          topic_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_topics_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_topics_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syllabus_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          created_at: string | null
          id: string
          marks_obtained: number
          remarks: string | null
          student_id: string
          test_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          marks_obtained: number
          remarks?: string | null
          student_id: string
          test_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          marks_obtained?: number
          remarks?: string | null
          student_id?: string
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          max_marks: number
          name: string
          subject_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          max_marks: number
          name: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          max_marks?: number
          name?: string
          subject_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          room_number: string | null
          school_id: string | null
          start_time: string
          subject_id: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          room_number?: string | null
          school_id?: string | null
          start_time: string
          subject_id: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          room_number?: string | null
          school_id?: string | null
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_schools: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_schools_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent" | "student" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "parent", "student", "super_admin"],
    },
  },
} as const
