import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { UnauthorizedPage } from "../pages/UnauthorizedPage";
import { AuthorDashboardPage } from "../pages/author/AuthorDashboardPage";
import { AuthorTicketsPage } from "../pages/author/AuthorTicketsPage";
import { AuthorProfilePage } from "../pages/author/AuthorProfilePage";
import { AdminQueuePage } from "../pages/admin/AdminQueuePage";
import { AdminAuthorsPage } from "../pages/admin/AdminAuthorsPage";
import { AdminBooksPage } from "../pages/admin/AdminBooksPage";
import { AdminAnalyticsPage } from "../pages/admin/AdminAnalyticsPage";
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
              <Route path="tickets" element={<AuthorTicketsPage />} />
              <Route path="tickets/new" element={<Navigate to="/author/tickets?new=true" replace />} />
              <Route path="profile" element={<AuthorProfilePage />} />
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
              <Route path="authors" element={<AdminAuthorsPage />} />
              <Route path="books" element={<AdminBooksPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
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
