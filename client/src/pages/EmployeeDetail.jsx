import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeService } from '../services/employeeService';
import { Button, LoadingSpinner, Badge, Card, Avatar } from '../components/common';
import { useAuth } from '../context/AuthContext';

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getById(id);
      setEmployee(response.data.employee);
    } catch (error) {
      toast.error('Failed to fetch employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!employee) {
    return <div>Employee not found</div>;
  }

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'warning',
      terminated: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getEmploymentTypeBadge = (type) => {
    const variants = {
      'full-time': 'default',
      'part-time': 'info',
      'contract': 'warning',
    };
    return <Badge variant={variants[type] || 'default'}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/employees')} className="p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-sm text-gray-500">{employee.designation}</p>
          </div>
        </div>
        {isAdminOrHR() && (
          <Button onClick={() => navigate(`/employees/${id}/edit`)}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Employee
          </Button>
        )}
      </div>

      {/* Profile Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
        <div className="relative pt-8 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Avatar
              name={`${employee.firstName} ${employee.lastName}`}
              size="xl"
              className="ring-4 ring-white shadow-lg"
            />
            <div className="flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {employee.firstName} {employee.lastName}
                </h2>
                {getStatusBadge(employee.status)}
                {getEmploymentTypeBadge(employee.employmentType)}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {employee.department?.name || 'No Department'}
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  {employee.employeeId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{employee.employeeId}</code>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{employee.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{employee.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-900 capitalize">{employee.gender || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }) : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {employee.address?.city ? `${employee.address.city}, ${employee.address.state}` : '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Employment Details */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Employment Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{employee.department?.name || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{employee.designation}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Date of Joining</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(employee.dateOfJoining).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Employment Type</p>
                <p className="font-medium text-gray-900 capitalize">{employee.employmentType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Reporting Manager</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {employee.reportingManager
                    ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}`
                    : '-'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Date of Leaving</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {employee.dateOfLeaving ? new Date(employee.dateOfLeaving).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </Card>

          {/* Salary Details - Only for Admin/HR */}
          {isAdminOrHR() && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Salary Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Basic Salary</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${employee.salary?.basic?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View Leaves
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Payroll
              </Button>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Emergency Contact</h3>
            </div>
            {employee.emergencyContact?.name ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{employee.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Relationship</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{employee.emergencyContact.relationship}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{employee.emergencyContact.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No emergency contact provided</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;