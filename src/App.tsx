import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AppLayout } from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import TeacherLogin from "./pages/TeacherLogin";
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
import AIAssistant from "./pages/AIAssistant";
import AdminFineTuning from "./pages/AdminFineTuning";
import SecurityDashboard from "./pages/SecurityDashboard";
import AdminTeachers from "./pages/AdminTeachers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/login/teacher" element={<TeacherLogin />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Students />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Teachers />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Classes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Subjects />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Attendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fees"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Fees />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams"
            element={<Navigate to="/tests" replace />}
          />
          <Route
            path="/tests"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Tests />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tests/:testId"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TestDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Timetable />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transport"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Transport />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ParentPortal />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/transport"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ParentTransportView />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Quizzes />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/syllabus"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Syllabus />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Notifications />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-cards"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ReportCards />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-assistant"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AIAssistant />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fine-tuning"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminFineTuning />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/security"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <SecurityDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminTeachers />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
