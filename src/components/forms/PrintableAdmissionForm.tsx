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

interface PrintableAdmissionFormProps {
  children: React.ReactNode;
}

export function PrintableAdmissionForm({ children }: PrintableAdmissionFormProps) {
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
          <title>Holy Cross School - Admission Form</title>
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
            .field-input-line {
              border-bottom: 1px solid #000;
              min-height: 24px;
              padding: 4px 0;
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
              gap: 15px;
              align-items: center;
            }
            .checkbox-item {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .checkbox {
              width: 14px;
              height: 14px;
              border: 1px solid #000;
              display: inline-block;
            }
            .sibling-table {
              width: 100%;
              border-collapse: collapse;
            }
            .sibling-table th,
            .sibling-table td {
              border: 1px solid #999;
              padding: 5px 8px;
              text-align: center;
              font-size: 9pt;
            }
            .sibling-table th {
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
            <span>Printable Admission Form</span>
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
              STUDENT ADMISSION FORM
            </div>
            <div className="academic-year text-sm mt-1">
              Academic Year: 2024-25
            </div>
          </div>

          {/* Instructions */}
          <div className="instructions bg-gray-100 border border-gray-300 p-3 mb-4 text-xs">
            <div className="instructions-title font-bold mb-2">INSTRUCTIONS FOR PARENTS:</div>
            <ul className="list-disc ml-4 space-y-1">
              <li>Please fill this form in BLOCK LETTERS using black or blue ink.</li>
              <li>All dates should be in DD/MM/YYYY format.</li>
              <li>Attach a recent passport-size photograph of the student.</li>
              <li>Tick (✓) the applicable checkbox options.</li>
              <li>Ensure all required documents are attached with this form.</li>
            </ul>
          </div>

          {/* Section A: Student Information */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION A: STUDENT INFORMATION
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="photo-section flex gap-4">
                <div className="photo-box w-[35mm] h-[45mm] border-2 border-dashed border-gray-500 flex items-center justify-center text-center text-xs text-gray-500 flex-shrink-0">
                  Paste Passport<br />Size Photo<br />(3.5cm × 4.5cm)
                </div>
                <div className="photo-fields flex-1">
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
                    <div className="field flex-1 min-w-[100px]">
                      <div className="field-label text-xs font-bold mb-1">Date of Birth (DD/MM/YYYY)</div>
                      <div className="field-input border border-gray-400 h-7 px-2"></div>
                    </div>
                    <div className="field flex-1 min-w-[100px]">
                      <div className="field-label text-xs font-bold mb-1">Place of Birth</div>
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
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2 mt-3">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">PEN Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Aadhar Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Blood Group</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Village</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Taluka</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">District</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>

              <div className="field-row flex flex-wrap gap-3">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Full Address</div>
                  <div className="field-input border border-gray-400 h-14 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Father's Details */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION B: FATHER'S DETAILS
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-[2] min-w-[180px]">
                  <div className="field-label text-xs font-bold mb-1">Father's Full Name</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Living</div>
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
                  <div className="field-label text-xs font-bold mb-1">Aadhar Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Qualification</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Occupation</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Phone Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Mother's Details */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION C: MOTHER'S DETAILS
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-[2] min-w-[180px]">
                  <div className="field-label text-xs font-bold mb-1">Mother's Full Name</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Living</div>
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
                  <div className="field-label text-xs font-bold mb-1">Aadhar Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Qualification</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Occupation</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Phone Number</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Family Information */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION D: FAMILY INFORMATION
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Annual Income</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Nationality</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Religion</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Caste</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Category</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[100px]">
                  <div className="field-label text-xs font-bold mb-1">Mother Tongue</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[120px]">
                  <div className="field-label text-xs font-bold mb-1">Other Languages</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Guardian's Address (if different from above)</div>
                  <div className="field-input border border-gray-400 h-10 px-2"></div>
                </div>
              </div>
              <div className="field-row">
                <div className="field-label text-xs font-bold mb-2">Number of Siblings:</div>
                <table className="sibling-table w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 p-1 bg-gray-100"></th>
                      <th className="border border-gray-400 p-1 bg-gray-100">Elder</th>
                      <th className="border border-gray-400 p-1 bg-gray-100">Younger</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-1 font-bold">Brothers</td>
                      <td className="border border-gray-400 p-1 h-6"></td>
                      <td className="border border-gray-400 p-1 h-6"></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1 font-bold">Sisters</td>
                      <td className="border border-gray-400 p-1 h-6"></td>
                      <td className="border border-gray-400 p-1 h-6"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section E: Previous School Details */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION E: PREVIOUS SCHOOL DETAILS
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field w-full">
                  <div className="field-label text-xs font-bold mb-1">Name of Previous School</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
              <div className="field-row flex flex-wrap gap-3 mb-2">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Standards Attended</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">Date of Leaving (DD/MM/YYYY)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">SLC Produced</div>
                  <div className="checkbox-group flex gap-4 h-7 items-center">
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> Yes
                    </span>
                    <span className="checkbox-item flex items-center gap-1">
                      <span className="checkbox w-4 h-4 border border-black inline-block"></span> No
                    </span>
                  </div>
                </div>
                <div className="field flex-1 min-w-[140px]">
                  <div className="field-label text-xs font-bold mb-1">SLC Date (DD/MM/YYYY)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section F: Admission Details */}
          <div className="section mb-4">
            <div className="section-header bg-gray-200 px-3 py-2 font-bold text-sm border border-gray-400 border-b-0">
              SECTION F: ADMISSION DETAILS
            </div>
            <div className="section-content border border-gray-400 p-3">
              <div className="field-row flex flex-wrap gap-3">
                <div className="field flex-1 min-w-[120px]">
                  <div className="field-label text-xs font-bold mb-1">Admission to Standard</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[120px]">
                  <div className="field-label text-xs font-bold mb-1">Medium of Instruction</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
                <div className="field flex-1 min-w-[120px]">
                  <div className="field-label text-xs font-bold mb-1">House (if applicable)</div>
                  <div className="field-input border border-gray-400 h-7 px-2"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="declaration border border-gray-400 p-3 mt-4">
            <div className="declaration-text text-xs text-justify mb-4">
              I hereby declare that the information provided above is true and correct to the best of my knowledge. 
              I understand that any false information may result in the cancellation of admission. 
              I agree to abide by the rules and regulations of Holy Cross School.
            </div>
            <div className="signature-row flex justify-between mt-8">
              <div className="signature-box text-center">
                <div className="signature-line w-36 border-t border-black mb-1 mx-auto"></div>
                <div className="signature-label text-xs">Parent/Guardian Signature</div>
              </div>
              <div className="signature-box text-center">
                <div className="signature-line w-36 border-t border-black mb-1 mx-auto"></div>
                <div className="signature-label text-xs">Date</div>
              </div>
            </div>
          </div>

          {/* Office Use Only */}
          <div className="office-use border-2 border-black p-3 mt-4">
            <div className="office-header font-bold text-center mb-3 text-sm">FOR OFFICE USE ONLY</div>
            <div className="field-row flex flex-wrap gap-3 mb-2">
              <div className="field flex-1 min-w-[120px]">
                <div className="field-label text-xs font-bold mb-1">Admission Number</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
              <div className="field flex-1 min-w-[120px]">
                <div className="field-label text-xs font-bold mb-1">Admission Date</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
              <div className="field flex-1 min-w-[120px]">
                <div className="field-label text-xs font-bold mb-1">Class Assigned</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
            </div>
            <div className="field-row flex flex-wrap gap-3">
              <div className="field flex-1 min-w-[120px]">
                <div className="field-label text-xs font-bold mb-1">Fee Receipt No.</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
              <div className="field flex-1 min-w-[140px]">
                <div className="field-label text-xs font-bold mb-1">Verified By</div>
                <div className="field-input border border-gray-400 h-7 px-2"></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
