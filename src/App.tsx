import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SchoolProvider } from "./contexts/SchoolContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { SuperAdminRoute } from "./components/auth/SuperAdminRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TeacherLogin from "./pages/TeacherLogin";
import SchoolSelector from "./pages/SchoolSelector";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Subjects from "./pages/Subjects";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Exams from "./pages/Exams";
import Tests from "./pages/Tests";
import TestDetails from "./pages/TestDetails";
import Timetable from "./pages/Timetable";
import Transport from "./pages/Transport";
import ParentPortal from "./pages/ParentPortal";
import Quizzes from "./pages/Quizzes";
import Syllabus from "./pages/Syllabus";
import Notifications from "./pages/Notifications";
import ReportCards from "./pages/ReportCards";
import ParentTransportView from "./pages/ParentTransportView";
import Reports from "./pages/Reports";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminTeachers from "./pages/AdminTeachers";
import AcademicCalendar from "./pages/AcademicCalendar";
import StudentProfile from "./pages/StudentProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// Helper to wrap a page with ProtectedRoute + AppLayout
function ProtectedPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AdminRoute>
        <AppLayout>{children}</AppLayout>
      </AdminRoute>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SchoolProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login/teacher" element={<TeacherLogin />} />
            <Route path="/select-school" element={<ProtectedRoute><SchoolSelector /></ProtectedRoute>} />
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/dashboard" element={<ProtectedPage><Dashboard /></ProtectedPage>} />
            <Route path="/students" element={<ProtectedPage><Students /></ProtectedPage>} />
            <Route path="/students/:id" element={<ProtectedPage><StudentProfile /></ProtectedPage>} />
            <Route path="/teachers" element={<ProtectedPage><Teachers /></ProtectedPage>} />
            <Route path="/classes" element={<ProtectedPage><Classes /></ProtectedPage>} />
            <Route path="/subjects" element={<ProtectedPage><Subjects /></ProtectedPage>} />
            <Route path="/attendance" element={<ProtectedPage><Attendance /></ProtectedPage>} />
            <Route path="/fees" element={<ProtectedPage><Fees /></ProtectedPage>} />
            <Route path="/exams" element={<ProtectedPage><Exams /></ProtectedPage>} />
            <Route path="/tests" element={<ProtectedPage><Tests /></ProtectedPage>} />
            <Route path="/tests/:testId" element={<ProtectedPage><TestDetails /></ProtectedPage>} />
            <Route path="/timetable" element={<ProtectedPage><Timetable /></ProtectedPage>} />
            <Route path="/transport" element={<ProtectedPage><Transport /></ProtectedPage>} />
            <Route path="/parent" element={<ProtectedPage><ParentPortal /></ProtectedPage>} />
            <Route path="/parent/transport" element={<ProtectedPage><ParentTransportView /></ProtectedPage>} />
            <Route path="/quizzes" element={<ProtectedPage><Quizzes /></ProtectedPage>} />
            <Route path="/syllabus" element={<ProtectedPage><Syllabus /></ProtectedPage>} />
            <Route path="/notifications" element={<ProtectedPage><Notifications /></ProtectedPage>} />
            <Route path="/report-cards" element={<ProtectedPage><ReportCards /></ProtectedPage>} />
            <Route path="/reports" element={<ProtectedPage><Reports /></ProtectedPage>} />
            <Route path="/admin/security" element={<AdminPage><SecurityDashboard /></AdminPage>} />
            <Route path="/admin/teachers" element={<AdminPage><AdminTeachers /></AdminPage>} />
            <Route path="/calendar" element={<ProtectedPage><AcademicCalendar /></ProtectedPage>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SchoolProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
