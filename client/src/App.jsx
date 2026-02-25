import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth';
import { Login, Register } from './components/auth';
import { MainLayout } from './components/layout';
import { Dashboard, PlaceholderPage, Departments, Employees, EmployeeDetail, Attendance, Leaves } from './pages';
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
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
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
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leaves />} />
        <Route
          path="onboarding"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <PlaceholderPage title="Onboarding" />
            </ProtectedRoute>
          }
        />
        <Route path="payroll" element={<PlaceholderPage title="Payroll" />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;