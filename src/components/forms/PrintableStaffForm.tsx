import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import { useRef } from "react";

interface PrintableStaffFormProps {
  children: React.ReactNode;
}

export function PrintableStaffForm({ children }: PrintableStaffFormProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Holy Cross School - Staff Registration Form</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
              background: #fff;
              padding: 10mm;
            }
            .form-container {
              max-width: 190mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .school-name {
              font-size: 22pt;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .form-title {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 5px;
            }
            .academic-year {
              font-size: 11pt;
              margin-top: 3px;
            }
            .instructions {
              background: #f5f5f5;
              border: 1px solid #ccc;
              padding: 8px 12px;
              margin-bottom: 15px;
              font-size: 9pt;
            }
            .instructions-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .instructions ul {
              margin-left: 15px;
            }
            .section {
              margin-bottom: 12px;
              page-break-inside: avoid;
            }
            .section-header {
              background: #e0e0e0;
              padding: 5px 10px;
              font-weight: bold;
              font-size: 11pt;
              border: 1px solid #999;
              border-bottom: none;
            }
            .section-content {
              border: 1px solid #999;
              padding: 10px;
            }
            .field-row {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              margin-bottom: 8px;
            }
            .field {
              flex: 1;
              min-width: 120px;
            }
            .field-full {
              width: 100%;
            }
            .field-label {
              font-size: 9pt;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .field-input {
              border: 1px solid #999;
              min-height: 28px;
              padding: 4px 6px;
              background: #fff;
            }
            .field-input-tall {
              border: 1px solid #999;
              min-height: 50px;
              padding: 4px 6px;
              background: #fff;
            }
            .photo-section {
              display: flex;
              gap: 15px;
              align-items: flex-start;
            }
            .photo-box {
              width: 35mm;
              height: 45mm;
              border: 2px dashed #666;
              display: flex;
              align-items: center;
              justify-content: center;
              text-align: center;
              font-size: 8pt;
              color: #666;
              flex-shrink: 0;
            }
            .photo-fields {
              flex: 1;
            }
            .checkbox-group {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              align-items: center;
            }
            .checkbox-item {
              display: flex;
              align-items: center;
              gap: 5px;
              font-size: 9pt;
            }
            .checkbox {
              width: 14px;
              height: 14px;
              border: 1px solid #000;
              display: inline-block;
            }
            .checklist-table {
              width: 100%;
              border-collapse: collapse;
            }
            .checklist-table th,
            .checklist-table td {
              border: 1px solid #999;
              padding: 5px 8px;
              text-align: left;
              font-size: 9pt;
            }
            .checklist-table th {
              background: #f0f0f0;
            }
            .declaration {
              margin-top: 15px;
              padding: 10px;
              border: 1px solid #999;
            }
            .declaration-text {
              font-size: 10pt;
              margin-bottom: 15px;
              text-align: justify;
            }
            .signature-row {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
            }
            .signature-box {
              text-align: center;
            }
            .signature-line {
              width: 150px;
              border-top: 1px solid #000;
              margin-bottom: 5px;
            }
            .signature-label {
              font-size: 9pt;
            }
            .office-use {
              margin-top: 15px;
              border: 2px solid #000;
              padding: 10px;
            }
            .office-header {
              font-weight: bold;
              text-align: center;
              margin-bottom: 10px;
              font-size: 10pt;
            }
            @media print {
              body {
                padding: 5mm;
              }
              .no-print {
                display: none !important;
              }
            }
            @page {
              size: A4;
              margin: 10mm;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Printable Staff Registration Form</span>
            <Button onClick={handlePrint} className="no-print">
              <Printer className="h-4 w-4 mr-2" />
              Print Form
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="form-container bg-white text-black p-4">
          {/* Header */}
          <div className="header text-center border-b-2 border-black pb-3 mb-4">
            <div className="school-name text-2xl font-bold uppercase tracking-widest">
              Holy Cross School
            </div>
            <div className="form-title text-lg font-bold mt-1">
              STAFF REGISTRATION FORM
            </div>
            <div className="academic-year text-sm mt-1">
              Academic Year: 2024-25
            </div>
          </div>

          {/* Instructions */}
          <div className="instructions bg-gray-100 border border-gray-300 p-3 mb-4 text-xs">
            <div className="instructions-title font-bold mb-2">INSTRUCTIONS FOR STAFF:</div>
            <ul className="list-disc ml-4 space-y-1">
              <li>Please fill this form in BLOCK LETTERS using black or blue ink.</li>
              <li>All dates should be in DD/MM/YYYY format.</li>
              <li>Attach a recent passport-size photograph.</li>
              <li>Tick (✓) the applicable checkbox options.</li>
              <li>Ensure all required documents are attached with this form.</li>
              <li>Fields marked with (*) are mandatory.</li>
            </ul>
          </div>

          {/* Section A: Basic Information */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION A: BASIC INFORMATION
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="photo-section flex gap-4">
                <div className="photo-box w-[35mm] h-[45mm] border-2 border-dashed border-gray-500 flex items-center justify-center text-center text-xs text-gray-500 flex-shrink-0">
                  Paste Passport<br />Size Photo<br />(3.5cm × 4.5cm)
                </div>
                <div className="photo-fields flex-1">
                  <div className="field-row flex flex-wrap gap-3 mb-2">
                    <div className="field flex-1 min-w-[120px]">
                      <div className="field-label text-xs font-bold mb-1">Employee Number *</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                    <div className="field flex-1 min-w-[120px]">
                      <div className="field-label text-xs font-bold mb-1">Department</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                  </div>
                  <div className="field-row flex flex-wrap gap-3 mb-2">
                    <div className="field flex-1 min-w-[120px]">
                      <div className="field-label text-xs font-bold mb-1">First Name *</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                    <div className="field flex-1 min-w-[120px]">
                      <div className="field-label text-xs font-bold mb-1">Last Name *</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                  </div>
                  <div className="field-row flex flex-wrap gap-3 mb-2">
                    <div className="field flex-1 min-w-[120px]">
                      <div className="field-label text-xs font-bold mb-1">Email *</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                    <div className="field flex-1 min-w-[120px]">
                      <div className="field-label text-xs font-bold mb-1">Phone Number</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2 mt-3">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Role *</div>
                  <div className="checkbox-group flex flex-wrap gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Teacher
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Head Teacher
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Principal
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Vice Principal
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Counselor
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Admin
                    </span>
                  </div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Designation</div>
                  <div className="checkbox-group flex flex-wrap gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Senior
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Junior
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Assistant
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Head
                    </span>
                  </div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Date of Birth (DD/MM/YYYY)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Date of Joining (DD/MM/YYYY)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Gender</div>
                  <div className="checkbox-group flex gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Male
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Female
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Other
                    </span>
                  </div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Emergency Contact Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">PAN Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Personal Details */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION B: PERSONAL DETAILS
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[180px]">
                  <div className="field-label text-xs font-bold mb-1">Father's Name</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[180px]">
                  <div className="field-label text-xs font-bold mb-1">Mother's Name</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Marital Status</div>
                  <div className="checkbox-group flex flex-wrap gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Single
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Married
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Divorced
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Widowed
                    </span>
                  </div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Current Address</div>
                  <div className="field-input border border-gray-400 h-14 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Permanent Address</div>
                  <div className="field-input border border-gray-400 h-14 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Qualifications & Experience */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION C: QUALIFICATIONS & EXPERIENCE
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Qualification (e.g., B.Ed., M.A., Ph.D.)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Work Experience (Previous schools/institutions, years of experience)</div>
                  <div className="field-input border border-gray-400 h-14 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Additional Notes / Specializations</div>
                  <div className="field-input border border-gray-400 h-10 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Payroll Information */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION D: PAYROLL INFORMATION
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">EPF Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Basic Salary (₹)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Contract Type</div>
                  <div className="checkbox-group flex flex-wrap gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Permanent
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Temporary
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Contract
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Probation
                    </span>
                  </div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Work Shift</div>
                  <div className="checkbox-group flex gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Morning
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Evening
                    </span>
                  </div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Work Location</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Leave Allocation (Office Use) */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION E: LEAVE ALLOCATION (OFFICE USE ONLY)
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Medical Leave (days)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Casual Leave (days)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Maternity Leave (days)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Sick Leave (days)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section F: Bank Account Details */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION F: BANK ACCOUNT DETAILS
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[180px]">
                  <div className="field-label text-xs font-bold mb-1">Account Holder Name (Title)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[180px]">
                  <div className="field-label text-xs font-bold mb-1">Bank Account Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Bank Name</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">IFSC Code</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Branch Name</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section G: Documents Checklist */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION G: DOCUMENTS CHECKLIST
            </div>
            <div className="section-content border border-gray-400 p-3">
              <table className="checklist-table w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-400 px-2 py-1 bg-gray-100 text-left">Document</th>
                    <th className="border border-gray-400 px-2 py-1 bg-gray-100 w-24 text-center">Attached</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">Resume / CV</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <span className="checkbox-item inline-flex items-center gap-1 mr-3">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> Yes
                      </span>
                      <span className="checkbox-item inline-flex items-center gap-1">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> No
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">Joining Letter</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <span className="checkbox-item inline-flex items-center gap-1 mr-3">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> Yes
                      </span>
                      <span className="checkbox-item inline-flex items-center gap-1">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> No
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">Educational Certificates (Degree, Diploma, etc.)</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <span className="checkbox-item inline-flex items-center gap-1 mr-3">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> Yes
                      </span>
                      <span className="checkbox-item inline-flex items-center gap-1">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> No
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">ID Proof (Aadhar Card / PAN Card)</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <span className="checkbox-item inline-flex items-center gap-1 mr-3">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> Yes
                      </span>
                      <span className="checkbox-item inline-flex items-center gap-1">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> No
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">Passport Size Photos (Qty: _____ )</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <span className="checkbox-item inline-flex items-center gap-1 mr-3">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> Yes
                      </span>
                      <span className="checkbox-item inline-flex items-center gap-1">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> No
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">Other Documents (specify: ________________)</td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      <span className="checkbox-item inline-flex items-center gap-1 mr-3">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> Yes
                      </span>
                      <span className="checkbox-item inline-flex items-center gap-1">
                        <span className="checkbox w-3 h-3 border border-black inline-block"></span> No
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Declaration */}
          <div className="declaration border border-gray-400 p-3 mb-4">
            <div className="declaration-text text-xs text-justify mb-4">
              <strong>DECLARATION:</strong> I hereby declare that all the information provided above is true and correct to the best of my knowledge. I understand that any false information may result in the cancellation of my employment. I agree to abide by the rules and regulations of Holy Cross School.
            </div>
            <div className="signature-row flex justify-between mt-6">
              <div className="signature-box text-center">
                <div className="signature-line w-36 border-t border-black mb-1 mx-auto"></div>
                <div className="signature-label text-xs">Staff Signature</div>
              </div>
              <div className="signature-box text-center">
                <div className="signature-line w-36 border-t border-black mb-1 mx-auto"></div>
                <div className="signature-label text-xs">Date</div>
              </div>
              <div className="signature-box text-center">
                <div className="signature-line w-36 border-t border-black mb-1 mx-auto"></div>
                <div className="signature-label text-xs">Witness Signature</div>
              </div>
            </div>
          </div>

          {/* Office Use Only */}
          <div className="office-use border-2 border-black p-3">
            <div className="office-header font-bold text-center text-sm mb-3">FOR OFFICE USE ONLY</div>
            <div className="field-row flex flex-wrap gap-3 mb-2">
              <div className="field flex-1 min-w-[140px]">
                <div className="field-label text-xs font-bold mb-1">Employee ID Assigned</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
              <div className="field flex-1 min-w-[140px]">
                <div className="field-label text-xs font-bold mb-1">Login Credentials Created</div>
                <div className="checkbox-group flex gap-4 h-7 items-center">
                  <span className="checkbox-item flex items-center gap-1">
                    <span className="checkbox w-4 h-4 border border-black inline-block"></span> Yes
                  </span>
                  <span className="checkbox-item flex items-center gap-1">
                    <span className="checkbox w-4 h-4 border border-black inline-block"></span> No
                  </span>
                </div>
              </div>
            </div>
            <div className="field-row flex flex-wrap gap-3 mb-2">
              <div className="field flex-1 min-w-[140px]">
                <div className="field-label text-xs font-bold mb-1">Documents Verified By</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
              <div className="field flex-1 min-w-[140px]">
                <div className="field-label text-xs font-bold mb-1">Verified Date</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
            </div>
            <div className="field-row flex flex-wrap gap-3">
              <div className="field w-full">
                <div className="field-label text-xs font-bold mb-1">Remarks</div>
                <div className="field-input border border-gray-400 h-10 px-2"></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
