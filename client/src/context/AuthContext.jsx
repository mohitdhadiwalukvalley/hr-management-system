import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage first for instant loading
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setLoading(true);
      try {
        const response = await authService.getCurrentUser();
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const login = useCallback(async (email, password) => {
    try {
      // Clear any existing tokens before login attempt
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      const response = await authService.login(email, password);
      const { user, accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      toast.success('Login successful');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      // Clear any tokens on failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  }, [navigate]);

  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  }, [user]);

  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);
  const isHR = useCallback(() => hasRole('hr'), [hasRole]);
  const isEmployee = useCallback(() => hasRole('employee'), [hasRole]);
  const isAdminOrHR = useCallback(() => hasRole(['admin', 'hr']), [hasRole]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    hasRole,
    isAdmin,
    isHR,
    isEmployee,
    isAdminOrHR,
  }), [user, loading, login, logout, hasRole, isAdmin, isHR, isEmployee, isAdminOrHR]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
