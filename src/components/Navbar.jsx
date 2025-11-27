import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const toggleTheme = () => setDark(d => !d);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-700 dark:text-gray-200"><path d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5H4.5a.75.75 0 0 1-.75-.75Z"/></svg>
          </button>
          <Link to={user ? (user.role === 'driver' ? '/driver-dashboard' : user.role === 'owner' ? '/owner-dashboard' : '/admin-dashboard') : '/login'} className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">DriverConnect</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Toggle dark mode">
            {dark ? (
              // Sun icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-yellow-400"><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/><path d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 12 2.25Zm0 16.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75ZM4.469 4.469a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.062l-1.06-1.06a.75.75 0 0 1 0-1.062Zm12.882 12.882a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1-1.06 1.062l-1.06-1.06a.75.75 0 0 1 0-1.062ZM2.25 12a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 2.25 12Zm16.5 0a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75ZM4.469 19.531a.75.75 0 0 1 0-1.062l1.06-1.06a.75.75 0 1 1 1.062 1.06l-1.06 1.062a.75.75 0 0 1-1.062 0Zm12.882-12.882a.75.75 0 0 1 0-1.062l1.06-1.06a.75.75 0 1 1 1.062 1.06l-1.06 1.062a.75.75 0 0 1-1.062 0Z"/></svg>
            ) : (
              // Moon icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-gray-700 dark:text-gray-200"><path d="M21.752 15.002a9.718 9.718 0 0 1-9.69 7.248c-5.385 0-9.75-4.365-9.75-9.75 0-4.27 2.77-7.89 6.61-9.174a.75.75 0 0 1 .967.95A8.251 8.251 0 0 0 12 20.25c3.69 0 6.8-2.455 7.782-5.837a.75.75 0 0 1 1.97.589Z"/></svg>
            )}
          </button>
          {user && (
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">Welcome, <span className="font-medium">{user.name}</span></span>
          )}
          {user && user.role === 'driver' && (
            <Link to="/driver-profile" className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Profile</Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="px-3 py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800">Logout</button>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-3 py-1.5 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800">Sign in</Link>
              <Link to="/register" className="px-3 py-1.5 rounded-md text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
