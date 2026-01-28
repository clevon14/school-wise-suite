
# Printable Staff/Teacher Registration Form

## Overview
Create a professional, printable staff registration form template (similar to the student admission form) that can be distributed to new teachers/staff for filling out by hand. The form will match all fields in the digital `AddTeacherDialog` to enable potential future AI scanning integration.

## Form Sections (Matching Digital Form Fields)

```text
+--------------------------------------------------+
|              HOLY CROSS SCHOOL                    |
|        STAFF REGISTRATION FORM 2024-25            |
+--------------------------------------------------+
|                                                  |
|  SECTION A: BASIC INFORMATION                    |
|  +-----------------+  +------------------------+ |
|  | Photo Box       |  | Staff ID, Role, Dept   | |
|  | (Passport Size) |  | Name, Gender, DOB      | |
|  +-----------------+  | Phone, Email, PAN      | |
|                       +------------------------+ |
+--------------------------------------------------+
|  SECTION B: PERSONAL DETAILS                     |
|  Father/Mother Name | Marital Status            |
|  Address | Permanent Address                     |
+--------------------------------------------------+
|  SECTION C: QUALIFICATIONS & EXPERIENCE          |
|  Qualification | Work Experience | Joining Date  |
+--------------------------------------------------+
|  SECTION D: PAYROLL INFORMATION                  |
|  EPF No. | Basic Salary | Contract Type          |
|  Work Shift | Work Location                      |
+--------------------------------------------------+
|  SECTION E: LEAVE ALLOCATION                     |
|  Medical | Casual | Maternity | Sick             |
+--------------------------------------------------+
|  SECTION F: BANK ACCOUNT DETAILS                 |
|  Account Title | Account No. | Bank Name         |
|  IFSC Code | Branch Name                         |
+--------------------------------------------------+
|  SECTION G: DOCUMENTS CHECKLIST                  |
|  Resume | Joining Letter | ID Proof | Certs     |
+--------------------------------------------------+
|  DECLARATION & SIGNATURES                        |
|  Staff Signature | Date | Office Use Only        |
+--------------------------------------------------+
```

## Technical Implementation

### 1. New Component: PrintableStaffForm

**Location**: `src/components/forms/PrintableStaffForm.tsx`

Creates a React component that renders a print-optimized staff registration form:
- Uses the same CSS print styling approach as `PrintableAdmissionForm`
- Includes school branding header
- Renders all form fields as empty boxes with labels
- Includes instructions for filling
- Has a "Print Form" button (hidden when printing)

Key features:
- A4 paper size optimized
- Print-specific CSS for clean output
- Clear field labels matching the digital form schema
- Checkbox options for Gender, Marital Status, Contract Type
- Photo attachment box (3.5cm x 4.5cm)
- Document checklist section

### 2. Update Teachers Page

**Location**: `src/pages/Teachers.tsx`

Add a "Blank Form" button to the Teachers page header (similar to Students page) that opens the printable form dialog.

## Form Field Breakdown

### Section A: Basic Information
- Photo Box (passport size)
- Staff ID / Employee Number
- Role (checkboxes: Teacher, Head Teacher, Principal, Vice Principal, Counselor, Admin)
- Designation (checkboxes: Senior, Junior, Assistant, Head)
- Department
- First Name, Last Name
- Father's Name, Mother's Name
- Email (Login Username)
- Gender (checkboxes: Male, Female, Other)
- Date of Birth (DD/MM/YYYY)
- Date of Joining (DD/MM/YYYY)
- Phone Number
- Emergency Contact Number
- Marital Status (checkboxes: Single, Married, Divorced, Widowed)

### Section B: Address Information
- Current Address (multi-line)
- Permanent Address (multi-line)

### Section C: Qualifications & Experience
- Qualification (e.g., B.Ed., M.A., Ph.D.)
- Work Experience
- PAN Number
- Additional Notes

### Section D: Payroll Information
- EPF Number
- Basic Salary
- Contract Type (checkboxes: Permanent, Temporary, Contract, Probation)
- Work Shift (Morning/Evening)
- Work Location

### Section E: Leave Allocation (Office Use)
- Medical Leave (days)
- Casual Leave (days)
- Maternity Leave (days)
- Sick Leave (days)

### Section F: Bank Account Details
- Account Holder Name (Title)
- Bank Account Number
- Bank Name
- IFSC Code
- Branch Name

### Section G: Documents Checklist
- Resume (attached: Yes/No)
- Joining Letter (attached: Yes/No)
- Educational Certificates (attached: Yes/No)
- ID Proof - Aadhar/PAN (attached: Yes/No)
- Passport Size Photos (Qty: ___)
- Other Documents (attached: Yes/No)

### Declaration & Signature Section
- Declaration text for authenticity
- Staff Signature line
- Date line
- Witness Signature line

### Office Use Section
- Employee ID Assigned
- Login Credentials Created
- Documents Verified By
- Verified Date
- Remarks

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/forms/PrintableStaffForm.tsx` | Create | Main printable staff form component |
| `src/pages/Teachers.tsx` | Modify | Add "Blank Form" button |

## Design Considerations

### Print Quality
- A4 paper size optimized (210mm x 297mm)
- 11-12pt fonts for readability
- High contrast black text on white background
- No color dependencies for B&W printing
- Clear section borders and headers

### Optimized for Future AI Scanning
- Field labels match exactly what a potential scanner would expect
- Clear section demarcation helps AI identify regions
- Standardized date format instruction (DD/MM/YYYY)
- Checkbox options clearly marked

### Accessibility
- Clear instructions in simple language
- Adequate space for handwritten entries (minimum 28px height)
- Labels positioned above input boxes
- Important fields marked with asterisks (*)

## User Flow

1. Admin navigates to Teachers page
2. Clicks "Blank Form" button
3. Printable form opens in dialog
4. Clicks "Print" to print physical copies
5. Distributes forms to new staff for filling
6. Collects filled forms
7. Manually enters data into digital form (or future AI scan)
