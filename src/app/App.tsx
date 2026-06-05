import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/core/auth/AuthContext";
import { useAuth } from "@/core/auth/AuthContext";
import { isAdminUser, isMunicipalAdminUser } from "@/core/auth/roles";

import AdminControlPanelPage from "@/features/admin/pages/AdminControlPanel";
import AuthPage from "@/features/auth/pages/Auth";
import MunicipalAdminPanelPage from "@/features/municipal-admin/pages/MunicipalAdminPanel";
import ReportsPage from "@/features/reports/pages/MapPage";
import ReportDetailPage from "@/features/reports/pages/ReportDetail";
import CreateReportPage from "@/features/reports/pages/CreateReport";
import EditReportPage from "@/features/reports/pages/EditReport";
import NotFound from "@/pages/NotFound";
import MyReportsPage from "@/features/reports/pages/MyReports";

const queryClient = new QueryClient();

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/reports" replace />;
  }

  return children;
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AdminRoute({ children }: { children: JSX.Element }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdminUser(user)) {
    return <Navigate to="/reports" replace />;
  }

  return children;
}

function MunicipalAdminRoute({ children }: { children: JSX.Element }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isMunicipalAdminUser(user)) {
    return <Navigate to="/reports" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/reports" : "/auth"} replace />}
      />

      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <AuthPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/new"
        element={
          <ProtectedRoute>
            <CreateReportPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/:id"
        element={
          <ProtectedRoute>
            <ReportDetailPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute>
            <MyReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports/:id/edit"
        element={
          <ProtectedRoute>
            <EditReportPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminControlPanelPage />
          </AdminRoute>
        }
      />

      <Route
        path="/municipal-admin"
        element={
          <MunicipalAdminRoute>
            <MunicipalAdminPanelPage />
          </MunicipalAdminRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
