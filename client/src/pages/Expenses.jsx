import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge, LoadingSpinner, Modal, EmptyState } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getCurrencySymbol, getCountryByCode } from '../utils/currency';

// Local storage key for expenses
const EXPENSES_KEY = 'hr_expenses';

// Helper functions for local storage
const getStoredExpenses = () => {
  try {
    const stored = localStorage.getItem(EXPENSES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveExpenses = (expenses) => {
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
};

const Expenses = () => {
  const { user, isAdmin, isHR, isAdminOrHR, isEmployee } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
  });
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'travel',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState(null);

  const categories = [
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food & Meals' },
    { value: 'office', label: 'Office Supplies' },
    { value: 'software', label: 'Software & Tools' },
    { value: 'training', label: 'Training & Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'medical', label: 'Medical' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    // Re-filter when filters change
    fetchExpenses();
  }, [filters.status, filters.category]);

  const fetchExpenses = () => {
    try {
      setLoading(true);
      const allExpenses = getStoredExpenses();

      // Filter based on user role - STRICT VISIBILITY
      let filteredExpenses = [];

      // Create unique user identifier
      const currentUserId = user?._id || user?.id;
      const currentUserEmail = user?.email?.toLowerCase();

      if (isAdmin()) {
        // Admin sees all expenses (including HR)
        filteredExpenses = allExpenses;
      } else if (isHR()) {
        // HR can see:
        // 1. Their own expenses
        // 2. Employee expenses (role = 'employee')
        // HR CANNOT see other HR's expenses
        filteredExpenses = allExpenses.filter(exp => {
          const isOwnExpense = exp.employeeId === currentUserId ||
                               exp.employeeEmail?.toLowerCase() === currentUserEmail;
          const isEmployeeExpense = exp.employeeRole === 'employee';
          return isOwnExpense || isEmployeeExpense;
        });
      } else {
        // Employee sees ONLY their own expenses - NO OTHER EMPLOYEES
        filteredExpenses = allExpenses.filter(exp => {
          return exp.employeeId === currentUserId ||
                 exp.employeeEmail?.toLowerCase() === currentUserEmail;
        });
      }

      // Apply status and category filters
      if (filters.status) {
        filteredExpenses = filteredExpenses.filter(exp => exp.status === filters.status);
      }
      if (filters.category) {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === filters.category);
      }

      // Sort by date (newest first)
      filteredExpenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setExpenses(filteredExpenses);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to fetch expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const allExpenses = getStoredExpenses();

      const newExpense = {
        _id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        receipt: receiptPreview,
        status: 'pending',
        employeeId: user?._id || user?.id,
        employeeEmail: user?.email,
        employeeName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.email?.split('@')[0] || 'Unknown'),
        employeeRole: user?.role,
        workLocation: user?.workLocation || 'IN',
        currency: getCountryByCode(user?.workLocation || 'IN')?.currency || 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      allExpenses.push(newExpense);
      saveExpenses(allExpenses);

      toast.success('Expense submitted successfully');
      setShowModal(false);
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to submit expense');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const allExpenses = getStoredExpenses();
      const index = allExpenses.findIndex(exp => exp._id === id);
      if (index !== -1) {
        allExpenses[index].status = 'approved';
        allExpenses[index].updatedAt = new Date().toISOString();
        saveExpenses(allExpenses);
      }
      toast.success('Expense approved');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    try {
      const allExpenses = getStoredExpenses();
      const index = allExpenses.findIndex(exp => exp._id === id);
      if (index !== -1) {
        allExpenses[index].status = 'rejected';
        allExpenses[index].rejectionReason = reason;
        allExpenses[index].updatedAt = new Date().toISOString();
        saveExpenses(allExpenses);
      }
      toast.success('Expense rejected');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to reject expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const allExpenses = getStoredExpenses();
      const filtered = allExpenses.filter(exp => exp._id !== id);
      saveExpenses(filtered);
      toast.success('Expense deleted');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: 'travel',
      description: '',
      date: new Date().toISOString().split('T')[0],
      receipt: null,
    });
    setReceiptPreview(null);
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getCategoryLabel = (category) => {
    return categories.find(c => c.value === category)?.label || category;
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track your expenses</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg px-4 py-2">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Total: {formatCurrency(expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0), user?.workLocation || 'IN')}
            </span>
          </div>
        </div>
      </Card>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card>
          <EmptyState
            title="No expenses found"
            description="Add your first expense to get started"
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenses.map((expense) => (
            <Card key={expense._id} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{expense.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getCategoryLabel(expense.category)}</p>
                </div>
                {getStatusBadge(expense.status)}
              </div>

              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {formatCurrency(expense.amount, expense.workLocation || 'IN')}
              </div>

              {expense.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{expense.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span>{new Date(expense.date).toLocaleDateString()}</span>
                {isAdminOrHR() && expense.employeeName && (
                  <span className="flex items-center gap-1">
                    {expense.employeeName}
                    {expense.employeeRole === 'hr' && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs">(HR)</span>
                    )}
                  </span>
                )}
              </div>

              {expense.receipt && (
                <div className="mb-3">
                  <img
                    src={expense.receipt}
                    alt="Receipt"
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => { setSelectedExpense(expense); setShowViewModal(true); }}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSelectedExpense(expense); setShowViewModal(true); }}
                  className="flex-1"
                >
                  View
                </Button>
                {expense.status === 'pending' && isAdminOrHR() && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleApprove(expense._id)}
                      className="flex-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(expense._id)}
                      className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {expense.status === 'pending' && (expense.employeeId === user?._id || expense.employeeEmail === user?.email) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(expense._id)}
                    className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Expense"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Client Meeting Lunch"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Amount ({getCurrencySymbol(user?.workLocation || 'IN')})
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         hover:border-gray-300 dark:hover:border-gray-500 transition-all
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes / Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              rows={3}
              placeholder="Add notes about where/how you spent this amount..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Receipt / Screenshot (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0
                       file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30
                       file:text-blue-700 dark:file:text-blue-400"
            />
            {receiptPreview && (
              <img src={receiptPreview} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitLoading}>
              Submit Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Expense Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Expense Details"
        size="md"
      >
        {selectedExpense && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{selectedExpense.title}</h3>
              {getStatusBadge(selectedExpense.status)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(selectedExpense.amount, selectedExpense.workLocation || 'IN')}
                </p>
                <p className="text-xs text-gray-400">
                  {getCountryByCode(selectedExpense.workLocation || 'IN')?.currency} - {getCountryByCode(selectedExpense.workLocation || 'IN')?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getCategoryLabel(selectedExpense.category)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(selectedExpense.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(selectedExpense.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {selectedExpense.description && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">{selectedExpense.description}</p>
              </div>
            )}

            {selectedExpense.rejectionReason && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Rejection Reason</p>
                <p className="text-sm text-red-700 dark:text-red-300">{selectedExpense.rejectionReason}</p>
              </div>
            )}

            {selectedExpense.receipt && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Receipt</p>
                <img
                  src={selectedExpense.receipt}
                  alt="Receipt"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {isAdminOrHR() && selectedExpense.employeeName && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Submitted by</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                    {selectedExpense.employeeName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {selectedExpense.employeeName}
                      {selectedExpense.employeeRole === 'hr' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs">HR</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{selectedExpense.employeeEmail}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Expenses;