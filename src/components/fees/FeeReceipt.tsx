import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

interface FeeReceiptProps {
  student: {
    first_name: string;
    last_name: string;
    admission_number: string;
    class?: { name: string; section?: string };
    father_name?: string;
    parent_phone?: string;
  };
  payment: {
    receipt_number: string;
    amount: number;
    payment_method: string;
    payment_date: string;
  };
  feeName: string;
  totalAmount: number;
  balance: number;
}

export function FeeReceipt({ student, payment, feeName, totalAmount, balance }: FeeReceiptProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Receipt - ${payment.receipt_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
          .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #333; padding: 24px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 16px; }
          .header h1 { font-size: 22px; font-weight: bold; color: #1a1a1a; }
          .header p { font-size: 12px; color: #666; margin-top: 4px; }
          .receipt-title { text-align: center; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 12px 0; padding: 8px; background: #f0f0f0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
          .info-item { font-size: 13px; }
          .info-item .label { font-weight: 600; color: #555; }
          .info-item .value { margin-left: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; font-size: 13px; }
          th { background: #f5f5f5; font-weight: 600; }
          .amount-row td { font-weight: bold; }
          .footer { text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #ccc; }
          .footer p { font-size: 11px; color: #888; }
          .signature { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature div { text-align: center; font-size: 12px; }
          .signature .line { width: 150px; border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Holy Cross School</h1>
            <p>Fee Collection Receipt</p>
          </div>
          <div class="receipt-title">Payment Receipt</div>
          <div class="info-grid">
            <div class="info-item"><span class="label">Receipt No:</span><span class="value">${payment.receipt_number}</span></div>
            <div class="info-item"><span class="label">Date:</span><span class="value">${format(new Date(payment.payment_date), "dd/MM/yyyy")}</span></div>
            <div class="info-item"><span class="label">Student:</span><span class="value">${student.first_name} ${student.last_name}</span></div>
            <div class="info-item"><span class="label">Adm. No:</span><span class="value">${student.admission_number}</span></div>
            <div class="info-item"><span class="label">Class:</span><span class="value">${student.class?.name || ""} ${student.class?.section ? `(${student.class.section})` : ""}</span></div>
            <div class="info-item"><span class="label">Father:</span><span class="value">${student.father_name || "-"}</span></div>
          </div>
          <table>
            <thead>
              <tr><th>Fee Type</th><th style="text-align:right">Total (₹)</th><th style="text-align:right">Paid (₹)</th><th style="text-align:right">Balance (₹)</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>${feeName}</td>
                <td style="text-align:right">${Number(totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right">${Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right">${Number(balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
          <div class="info-item"><span class="label">Payment Mode:</span><span class="value" style="text-transform:capitalize">${payment.payment_method}</span></div>
          <div class="signature">
            <div><div class="line">Parent/Guardian</div></div>
            <div><div class="line">Authorized Signatory</div></div>
          </div>
          <div class="footer">
            <p>This is a computer-generated receipt. Thank you for your payment.</p>
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handlePrint} title="Print Receipt">
      <Printer className="h-4 w-4" />
    </Button>
  );
}
