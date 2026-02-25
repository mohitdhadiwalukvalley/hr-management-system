import { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await authService.getCurrentUser();
        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { user, accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      toast.success('Login successful');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (email, password, role) => {
    try {
      const response = await authService.register(email, password, role);
      const { user, accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      setUser(user);
      toast.success('Registration successful');
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isAdmin = () => hasRole('admin');
  const isHR = () => hasRole('hr');
  const isEmployee = () => hasRole('employee');
  const isAdminOrHR = () => hasRole(['admin', 'hr']);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isHR,
    isEmployee,
    isAdminOrHR,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;