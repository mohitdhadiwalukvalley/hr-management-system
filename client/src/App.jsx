import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth';
import { Login } from './components/auth';
import { MainLayout } from './components/layout';
import { LoadingSpinner } from './components/common';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const Departments = lazy(() => import('./pages/Departments'));
const Employees = lazy(() => import('./pages/Employees'));
const EmployeeDetail = lazy(() => import('./pages/EmployeeDetail'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Leaves = lazy(() => import('./pages/Leaves'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Reports = lazy(() => import('./pages/Reports'));
const Expenses = lazy(() => import('./pages/Expenses'));

// Loading fallback for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  const { user } = useAuth();

  // Don't wait for auth check - show login or dashboard immediately
  return (
    <Suspense fallback={<PageLoader />}>
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

          {/* Expenses - all roles (employees see their own, HR expenses only visible to Admin) */}
          <Route path="expenses" element={<Expenses />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
