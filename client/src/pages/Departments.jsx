import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { departmentService } from '../../services/departmentService';
import { Button, Input, LoadingSpinner } from '../common';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    leavePolicies: { casual: 12, sick: 6, earned: 15 },
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentService.getAll({ limit: 100 });
      setDepartments(response.data.departments);
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await departmentService.update(editingDepartment._id, formData);
        toast.success('Department updated successfully');
      } else {
        await departmentService.create(formData);
        toast.success('Department created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || '',
      leavePolicies: department.leavePolicies || { casual: 12, sick: 6, earned: 15 },
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this department?')) return;
    try {
      await departmentService.delete(id);
      toast.success('Department deactivated successfully');
      fetchDepartments();
    } catch (error) {
      toast.error('Failed to deactivate department');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      leavePolicies: { casual: 12, sick: 6, earned: 15 },
    });
    setEditingDepartment(null);
  };

  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Add Department
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <Input
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Policy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDepartments.map((dept) => (
                <tr key={dept._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{dept.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{dept.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    C: {dept.leavePolicies?.casual || 0} | S: {dept.leavePolicies?.sick || 0} | E: {dept.leavePolicies?.earned || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(dept)} className="mr-2">
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(dept._id)}>
                      Deactivate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingDepartment ? 'Edit Department' : 'Add Department'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Casual Leaves"
                  type="number"
                  value={formData.leavePolicies.casual}
                  onChange={(e) => setFormData({
                    ...formData,
                    leavePolicies: { ...formData.leavePolicies, casual: parseInt(e.target.value) || 0 },
                  })}
                />
                <Input
                  label="Sick Leaves"
                  type="number"
                  value={formData.leavePolicies.sick}
                  onChange={(e) => setFormData({
                    ...formData,
                    leavePolicies: { ...formData.leavePolicies, sick: parseInt(e.target.value) || 0 },
                  })}
                />
                <Input
                  label="Earned Leaves"
                  type="number"
                  value={formData.leavePolicies.earned}
                  onChange={(e) => setFormData({
                    ...formData,
                    leavePolicies: { ...formData.leavePolicies, earned: parseInt(e.target.value) || 0 },
                  })}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDepartment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Departments;