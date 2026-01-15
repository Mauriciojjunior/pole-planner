import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DASHBOARD_URL = "https://zvvvfitrolqeyrfszfcv.supabase.co/functions/v1/dashboard";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface TeacherSummary {
  total_classes: number;
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_attended: number;
  total_students: number;
  active_students: number;
  total_capacity: number;
  occupancy_rate: number;
  attendance_rate: number;
  cancellation_rate: number;
}

interface ClassStats {
  period: string;
  total_classes: number;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  attendance_count: number;
  max_capacity: number;
  occupancy_rate: number;
}

interface StudentStats {
  student_id: string;
  student_name: string;
  student_email: string;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  attended_classes: number;
  missed_classes: number;
  attendance_rate: number;
  last_class_date: string;
}

interface AdminSummary {
  total_teachers: number;
  active_teachers: number;
  pending_teachers: number;
  blocked_teachers: number;
  total_students: number;
  active_students: number;
  total_classes: number;
  total_bookings: number;
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
}

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface SubscriptionStats {
  status: string;
  count: number;
  percentage: number;
  total_revenue_cents: number;
}

interface UsageOverTime {
  period: string;
  new_teachers: number;
  new_students: number;
  classes_created: number;
  bookings_made: number;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Não autenticado");
  
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session.access_token}`,
  };
}

async function fetchDashboard<T>(
  endpoint: "teacher" | "admin",
  action: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const queryParams = new URLSearchParams({
    action,
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ),
  });
  
  const response = await fetch(
    `${DASHBOARD_URL}/${endpoint}?${queryParams}`,
    { headers }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao carregar dados");
  }
  
  const { data } = await response.json();
  return data;
}

// Teacher Dashboard Hooks
export function useTeacherSummary(dateRange: DateRange) {
  return useQuery({
    queryKey: ["teacher-dashboard", "summary", dateRange],
    queryFn: () => fetchDashboard<TeacherSummary>("teacher", "summary", {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherClassStats(
  dateRange: DateRange,
  groupBy: "day" | "week" | "month" = "day"
) {
  return useQuery({
    queryKey: ["teacher-dashboard", "classes", dateRange, groupBy],
    queryFn: () => fetchDashboard<ClassStats[]>("teacher", "classes", {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      group_by: groupBy,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTeacherStudentStats(
  dateRange?: DateRange,
  limit: number = 20
) {
  return useQuery({
    queryKey: ["teacher-dashboard", "students", dateRange, limit],
    queryFn: () => fetchDashboard<StudentStats[]>("teacher", "students", {
      ...(dateRange?.startDate && { start_date: dateRange.startDate }),
      ...(dateRange?.endDate && { end_date: dateRange.endDate }),
      limit,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

// Admin Dashboard Hooks
export function useAdminSummary(dateRange: DateRange) {
  return useQuery({
    queryKey: ["admin-dashboard", "summary", dateRange],
    queryFn: () => fetchDashboard<AdminSummary>("admin", "summary", {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminConversionFunnel(dateRange: DateRange) {
  return useQuery({
    queryKey: ["admin-dashboard", "funnel", dateRange],
    queryFn: () => fetchDashboard<FunnelStage[]>("admin", "funnel", {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSubscriptionStats() {
  return useQuery({
    queryKey: ["admin-dashboard", "subscriptions"],
    queryFn: () => fetchDashboard<SubscriptionStats[]>("admin", "subscriptions", {}),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminUsageOverTime(
  dateRange: DateRange,
  groupBy: "day" | "week" | "month" = "day"
) {
  return useQuery({
    queryKey: ["admin-dashboard", "usage", dateRange, groupBy],
    queryFn: () => fetchDashboard<UsageOverTime[]>("admin", "usage", {
      start_date: dateRange.startDate,
      end_date: dateRange.endDate,
      group_by: groupBy,
    }),
    staleTime: 5 * 60 * 1000,
  });
}

// Export function
export async function exportTeacherData(
  dateRange: DateRange,
  exportType: "bookings" | "students" | "classes",
  format: "json" | "csv" = "csv"
): Promise<string | object[]> {
  const headers = await getAuthHeaders();
  
  const queryParams = new URLSearchParams({
    action: "export",
    start_date: dateRange.startDate,
    end_date: dateRange.endDate,
    export_type: exportType,
    format,
  });
  
  const response = await fetch(
    `${DASHBOARD_URL}/teacher?${queryParams}`,
    { headers }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erro ao exportar dados");
  }
  
  if (format === "csv") {
    return await response.text();
  }
  
  const { data } = await response.json();
  return data;
}

// Download helper
export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// PDF export helper (uses browser print)
export function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          .chart { page-break-inside: avoid; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
