import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard } from './components/AuthGuard'
import { RoleRedirect } from './pages/RoleRedirect'
import { LoginPage } from './pages/LoginPage'
import { UnauthorizedPage } from './pages/UnauthorizedPage'
import { LecturerDashboard } from './pages/LecturerDashboard'
import { SessionDetail } from './pages/SessionDetail'
import { AdminDashboard } from './pages/AdminDashboard'
import { EnrollmentsPage } from './pages/EnrollmentsPage'
import { LecturerDashboardWeb } from './pages/LecturerDashboardWeb'
import { SessionDetailWeb } from './pages/SessionDetailWeb'
import { AdminDashboardWeb } from './pages/AdminDashboardWeb'
import { EnrollmentsWeb } from './pages/EnrollmentsWeb'
import { useIsMobile } from './hooks/useIsMobile'

export default function App() {
  const isMobile = useIsMobile()

  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route path="/lecturer" element={<Navigate to="/lecturer/dashboard" replace />} />
      <Route path="/lecturer/dashboard" element={
        <AuthGuard requiredRole="lecturer">
          {isMobile ? <LecturerDashboard /> : <LecturerDashboardWeb />}
        </AuthGuard>
      } />
      <Route path="/lecturer/sessions/:id" element={
        <AuthGuard requiredRole="lecturer">
          {isMobile ? <SessionDetail /> : <SessionDetailWeb />}
        </AuthGuard>
      } />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={
        <AuthGuard requiredRole="admin">
          {isMobile ? <AdminDashboard /> : <AdminDashboardWeb />}
        </AuthGuard>
      } />
      <Route path="/admin/sessions/:id" element={
        <AuthGuard requiredRole="admin">
          {isMobile ? <SessionDetail readonly /> : <SessionDetailWeb readonly />}
        </AuthGuard>
      } />
      <Route path="/admin/enrollments" element={
        <AuthGuard requiredRole="admin">
          {isMobile ? <EnrollmentsPage /> : <EnrollmentsWeb />}
        </AuthGuard>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
