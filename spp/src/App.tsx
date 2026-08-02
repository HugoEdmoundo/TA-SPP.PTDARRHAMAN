import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './components/ui/ToastContext';
import { AdminLayout } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { UsersPage } from './pages/admin/UsersPage';
import { SppGridPage } from './pages/admin/SppGridPage';
import { NonSppPage } from './pages/admin/NonSppPage';
import { EventsPage } from './pages/admin/EventsPage';
import { ManualPaymentPage } from './pages/admin/ManualPaymentPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { InfaqPage } from './pages/admin/InfaqPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { StudentHistoryPage } from './pages/admin/StudentHistoryPage';

export function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Default redirect to login or admin */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="spp" element={<SppGridPage />} />
                <Route path="non-spp" element={<NonSppPage />} />
                <Route path="event" element={<EventsPage />} />
                <Route path="infaq" element={<InfaqPage />} />
                <Route path="payment" element={<ManualPaymentPage />} />
                <Route path="student-history" element={<StudentHistoryPage />} />
                <Route path="profile" element={<AdminProfilePage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route
                  path="audit"
                  element={
                    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                      <AuditLogPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="students" element={<StudentsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
