import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { departmentService } from '../services/departmentService';
import { Button, Input, LoadingSpinner, Badge, Card, Modal, EmptyState } from '../components/common';

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
    if (!window.confirm('Are you sure you want to delete this department? This action cannot be undone.')) return;
    try {
      await departmentService.delete(id);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
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

  const departmentColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-purple-500 to-purple-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage organizational structure and leave policies</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Department
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     hover:border-gray-300 transition-all"
          />
        </div>
      </Card>

      {/* Department Cards Grid */}
      {filteredDepartments.length === 0 ? (
        <Card>
          <EmptyState
            title="No departments found"
            description="Create your first department to get started"
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept, index) => (
            <Card key={dept._id} className="relative overflow-hidden">
              {/* Color accent */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${departmentColors[index % departmentColors.length]}`} />

              <div className="pt-2">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${departmentColors[index % departmentColors.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                      {dept.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dept.name}</h3>
                      <code className="text-sm text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{dept.code}</code>
                    </div>
                  </div>
                  <Badge variant={dept.isActive ? 'success' : 'danger'} size="sm">
                    {dept.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {dept.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{dept.description}</p>
                )}

                {/* Leave Policies */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Leave Policy (days/year)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{dept.leavePolicies?.casual || 0}</p>
                      <p className="text-xs text-gray-500">Casual</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{dept.leavePolicies?.sick || 0}</p>
                      <p className="text-xs text-gray-500">Sick</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{dept.leavePolicies?.earned || 0}</p>
                      <p className="text-xs text-gray-500">Earned</p>
                    </div>
                  </div>
                </div>

                {/* Manager */}
                {dept.manager && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{dept.manager.firstName} {dept.manager.lastName}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(dept)}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(dept._id)}
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingDepartment ? 'Edit Department' : 'Add Department'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Engineering"
          />
          <Input
            label="Department Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            placeholder="e.g., ENG"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       hover:border-gray-300 transition-all resize-none"
              rows={3}
              placeholder="Brief description of the department..."
            />
          </div>

          {/* Leave Policies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Leave Policy (days/year)</label>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                <Input
                  label="Casual"
                  type="number"
                  value={formData.leavePolicies.casual}
                  onChange={(e) => setFormData({
                    ...formData,
                    leavePolicies: { ...formData.leavePolicies, casual: parseInt(e.target.value) || 0 },
                  })}
                  className="text-center"
                />
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                <Input
                  label="Sick"
                  type="number"
                  value={formData.leavePolicies.sick}
                  onChange={(e) => setFormData({
                    ...formData,
                    leavePolicies: { ...formData.leavePolicies, sick: parseInt(e.target.value) || 0 },
                  })}
                  className="text-center"
                />
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                <Input
                  label="Earned"
                  type="number"
                  value={formData.leavePolicies.earned}
                  onChange={(e) => setFormData({
                    ...formData,
                    leavePolicies: { ...formData.leavePolicies, earned: parseInt(e.target.value) || 0 },
                  })}
                  className="text-center"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button type="button" variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit">
              {editingDepartment ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Departments;