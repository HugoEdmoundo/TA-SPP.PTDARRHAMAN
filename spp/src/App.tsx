import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './components/ui/ToastContext';
import { WaliLayout, AdminLayout } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/error/NotFoundPage';

// Admin Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { SppGridPage } from './pages/admin/SppGridPage';
import { NonSppPage } from './pages/admin/NonSppPage';
import { EventsPage } from './pages/admin/EventsPage';
import { PaymentKasirPage } from './pages/admin/PaymentKasirPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { ParentsPage } from './pages/admin/ParentsPage';

// Wali Pages
import { WaliDashboardPage } from './pages/wali/WaliDashboardPage';
import { WaliSppPage } from './pages/wali/WaliSppPage';
import { WaliEventPage } from './pages/wali/WaliEventPage';
import { WaliHistoryPage } from './pages/wali/WaliHistoryPage';
import { WaliProfilePage } from './pages/wali/WaliProfilePage';

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
                <Route path="payment" element={<PaymentKasirPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit" element={<AuditLogPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="parents" element={<ParentsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Wali Santri Protected Routes */}
              <Route
                path="/wali"
                element={
                  <ProtectedRoute allowedRoles={['WALI']}>
                    <WaliLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<WaliDashboardPage />} />
                <Route path="spp" element={<WaliSppPage />} />
                <Route path="event" element={<WaliEventPage />} />
                <Route path="history" element={<WaliHistoryPage />} />
                <Route path="profile" element={<WaliProfilePage />} />
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
