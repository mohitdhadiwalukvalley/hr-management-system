import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeService } from '../services/employeeService';
import { departmentService } from '../services/departmentService';
import { Button, Input, LoadingSpinner } from '../components/common';
import { useAuth } from '../context/AuthContext';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department: '', status: '', employmentType: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData());
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAdminOrHR } = useAuth();

  function getInitialFormData() {
    return {
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      dateOfJoining: '',
      employmentType: 'full-time',
      salary: { basic: 0, allowances: [], deductions: [] },
      bankDetails: { accountNo: '', ifsc: '', bankName: '' },
      address: { street: '', city: '', state: '', country: '', zipCode: '' },
      emergencyContact: { name: '', relationship: '', phone: '' },
    };
  }

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [pagination.page, filters]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        ...filters,
      });
      setEmployees(response.data.employees);
      setPagination((prev) => ({ ...prev, total: response.data.pagination.total, pages: response.data.pagination.pages }));
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data.departments.filter(d => d.isActive));
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEmployee) {
        await employeeService.update(editingEmployee._id, formData);
        toast.success('Employee updated successfully');
      } else {
        await employeeService.create(formData);
        toast.success('Employee created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      department: employee.department?._id || employee.department,
      designation: employee.designation,
      dateOfJoining: employee.dateOfJoining?.split('T')[0] || '',
      employmentType: employee.employmentType,
      salary: employee.salary || { basic: 0, allowances: [], deductions: [] },
      bankDetails: employee.bankDetails || { accountNo: '', ifsc: '', bankName: '' },
      address: employee.address || { street: '', city: '', state: '', country: '', zipCode: '' },
      emergencyContact: employee.emergencyContact || { name: '', relationship: '', phone: '' },
    });
    setShowModal(true);
  };

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      await employeeService.updateStatus(id, status);
      toast.success('Status updated successfully');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData(getInitialFormData());
    setEditingEmployee(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchEmployees();
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        {isAdminOrHR() && (
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            Add Employee
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                      <p className="text-sm text-gray-500">{emp.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.employeeId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.department?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{emp.designation}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      emp.status === 'active' ? 'bg-green-100 text-green-800' :
                      emp.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/employees/${emp._id}`)}>
                      View
                    </Button>
                    {isAdminOrHR() && (
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(emp)}>
                        Edit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {employees.length} of {pagination.total} employees
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editingEmployee ? 'Edit Employee' : 'Add Employee'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Employee ID"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                  required
                  disabled={!!editingEmployee}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Designation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                />
                <Input
                  label="Date of Joining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Basic Salary"
                  type="number"
                  value={formData.salary.basic}
                  onChange={(e) => setFormData({
                    ...formData,
                    salary: { ...formData.salary, basic: parseFloat(e.target.value) || 0 },
                  })}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingEmployee ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;