import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeService } from '../services/employeeService';
import { Button, LoadingSpinner } from '../components/common';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/employees')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(employee.status)}`}>
            {employee.status}
          </span>
        </div>
        {isAdminOrHR() && (
          <Button onClick={() => navigate(`/employees/${id}/edit`)}>
            Edit Employee
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium">{employee.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{employee.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{employee.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium capitalize">{employee.gender || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {employee.address?.city ? `${employee.address.city}, ${employee.address.state}` : '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">{employee.department?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-medium">{employee.designation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Joining</p>
                <p className="font-medium">
                  {new Date(employee.dateOfJoining).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employment Type</p>
                <p className="font-medium capitalize">{employee.employmentType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reporting Manager</p>
                <p className="font-medium">
                  {employee.reportingManager
                    ? `${employee.reportingManager.firstName} ${employee.reportingManager.lastName}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Leaving</p>
                <p className="font-medium">
                  {employee.dateOfLeaving ? new Date(employee.dateOfLeaving).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Salary Details - Only for Admin/HR */}
          {isAdminOrHR() && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Basic Salary</p>
                  <p className="font-medium">₹{employee.salary?.basic?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                View Attendance
              </Button>
              <Button variant="outline" className="w-full">
                View Leaves
              </Button>
              <Button variant="outline" className="w-full">
                View Payroll
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h2>
            {employee.emergencyContact?.name ? (
              <div className="space-y-2">
                <p className="text-sm"><strong>Name:</strong> {employee.emergencyContact.name}</p>
                <p className="text-sm"><strong>Relationship:</strong> {employee.emergencyContact.relationship}</p>
                <p className="text-sm"><strong>Phone:</strong> {employee.emergencyContact.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No emergency contact provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;