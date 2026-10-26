import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import { AuthorDashboardPage } from "../pages/author/AuthorDashboardPage";
import { AdminQueuePage } from "../pages/admin/AdminQueuePage";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { ROLES } from "../utils/constants";

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Website with Author & Admin Login Buttons */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Strictly Protected Author Portal Routes */}
      <Route
        path="/author/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.AUTHOR]}>
            <Routes>
              <Route path="dashboard" element={<AuthorDashboardPage />} />
              <Route path="tickets" element={<AuthorDashboardPage />} />
              <Route path="tickets/new" element={<AuthorDashboardPage />} />
              <Route path="*" element={<Navigate to="/author/dashboard" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Strictly Protected Admin & Operations Portal Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.OPERATIONS_EXECUTIVE]}>
            <Routes>
              <Route path="queue" element={<AdminQueuePage />} />
              <Route path="analytics" element={<AdminQueuePage />} />
              <Route path="books" element={<AdminQueuePage />} />
              <Route path="*" element={<Navigate to="/admin/queue" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
