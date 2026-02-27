import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    const titles = {
      '/dashboard': 'Dashboard',
      '/employees': 'Employees',
      '/departments': 'Departments',
      '/attendance': 'Attendance',
      '/leaves': 'Leave Management',
      '/onboarding': 'Onboarding',
      '/payroll': 'Payroll',
      '/reports': 'Reports',
    };

    // Check for dynamic routes
    if (path.startsWith('/employees/') && path !== '/employees') {
      return 'Employee Details';
    }

    return titles[path] || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} title={getPageTitle()} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;