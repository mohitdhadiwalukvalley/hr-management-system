import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth';
import { Login } from './components/auth';
import { MainLayout } from './components/layout';
import { Dashboard, PlaceholderPage, Departments, Employees, EmployeeDetail, Attendance, Leaves, Onboarding, Payroll, Reports } from './pages';
import { LoadingSpinner } from './components/common';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes - Login only, no public registration */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Admin/HR only routes */}
        <Route
          path="employees"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="employees/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <EmployeeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="departments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <Departments />
            </ProtectedRoute>
          }
        />

        {/* Attendance - all roles (employees see their own) */}
        <Route path="attendance" element={<Attendance />} />

        {/* Leaves - all roles (employees see their own) */}
        <Route path="leaves" element={<Leaves />} />

        {/* Admin/HR only routes */}
        <Route
          path="onboarding"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Payroll - all roles (employees see payslips only) */}
        <Route path="payroll" element={<Payroll />} />

        {/* Admin/HR only routes */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;