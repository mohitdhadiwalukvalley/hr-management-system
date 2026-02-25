import { useAuth } from '../../context/AuthContext';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'hr':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Mobile menu button */}
        <button
          type="button"
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          onClick={onMenuClick}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Page title or search - can be customized per page */}
        <div className="flex-1 lg:flex-none" />

        {/* User info */}
        <div className="flex items-center space-x-4">
          {/* Role badge */}
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user?.role)}`}>
            {user?.role?.toUpperCase()}
          </span>

          {/* User email */}
          <span className="hidden md:block text-sm text-gray-600">{user?.email}</span>

          {/* Logout button */}
          <button
            onClick={logout}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;