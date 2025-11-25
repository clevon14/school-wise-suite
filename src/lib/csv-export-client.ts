import { supabase } from "@/integrations/supabase/client";

interface ExportOptions {
  scope: 'test' | 'class' | 'student' | 'month_summary' | 'attendance';
  id?: string;
  filters?: {
    month?: number;
    year?: number;
    class_id?: string;
    start_date?: string;
    end_date?: string;
    month_start?: string;
    month_end?: string;
  };
}

export async function exportToCSV(options: ExportOptions): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-csv`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(options),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Export failed');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch?.[1] || `export_${Date.now()}.csv`;

    // Download the CSV file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV export error:', error);
    throw error;
  }
}
