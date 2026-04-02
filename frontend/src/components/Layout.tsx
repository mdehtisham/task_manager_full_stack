import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/tasks" className="text-xl font-bold text-blue-600">
              Task Manager
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.name}
                {user?.role === 'admin' && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Admin
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
