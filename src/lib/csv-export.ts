// CSV Export Utilities for School Management System

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape commas and quotes in string values
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(",");
    return headers.reduce((obj: any, header, index) => {
      let value = values[index]?.trim() || "";
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      
      // Try to parse JSON for complex values
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
      }
      
      obj[header] = value;
      return obj;
    }, {});
  }).filter(row => Object.values(row).some(v => v !== ""));
};

// Export templates for different entities
export const exportStudents = (students: any[]) => {
  const formatted = students.map(s => ({
    admission_number: s.admission_number,
    first_name: s.first_name,
    last_name: s.last_name,
    date_of_birth: s.date_of_birth,
    gender: s.gender,
    class: s.class ? `${s.class.name} ${s.class.section || ''}` : '',
    parent_name: s.parent_name,
    parent_email: s.parent_email,
    parent_phone: s.parent_phone,
    address: s.address,
    status: s.status,
  }));
  exportToCSV(formatted, "students");
};

export const exportTeachers = (teachers: any[]) => {
  const formatted = teachers.map(t => ({
    employee_number: t.employee_number,
    first_name: t.first_name,
    last_name: t.last_name,
    email: t.email,
    phone: t.phone,
    department: t.department,
    role: t.role,
    hire_date: t.hire_date,
    status: t.status,
  }));
  exportToCSV(formatted, "teachers");
};

export const exportAttendance = (attendance: any[]) => {
  const formatted = attendance.map(a => ({
    date: a.date,
    student_name: a.student ? `${a.student.first_name} ${a.student.last_name}` : '',
    admission_number: a.student?.admission_number || '',
    status: a.status,
    remarks: a.remarks,
  }));
  exportToCSV(formatted, "attendance");
};

export const exportFees = (fees: any[]) => {
  const formatted = fees.map(f => ({
    student_name: f.student ? `${f.student.first_name} ${f.student.last_name}` : '',
    admission_number: f.student?.admission_number || '',
    category: f.fee_category?.name || '',
    amount: f.amount,
    due_date: f.due_date,
    status: f.status,
    paid_amount: f.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
  }));
  exportToCSV(formatted, "fees");
};

export const exportExamResults = (marks: any[]) => {
  const formatted = marks.map(m => ({
    student_name: m.student ? `${m.student.first_name} ${m.student.last_name}` : '',
    admission_number: m.student?.admission_number || '',
    exam: m.exam_subject?.exam?.name || '',
    subject: m.exam_subject?.subject?.name || '',
    marks_obtained: m.marks_obtained,
    max_marks: m.exam_subject?.max_marks || 0,
    percentage: m.exam_subject?.max_marks ? ((m.marks_obtained / m.exam_subject.max_marks) * 100).toFixed(2) : 0,
    is_absent: m.is_absent,
  }));
  exportToCSV(formatted, "exam_results");
};
