import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { jobService } from '../services/api';

const NavItem = ({ to, icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
      ${active ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white' : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'}`}
  >
    <span className="h-5 w-5 text-gray-500 dark:text-gray-400">{icon}</span>
    <span>{label}</span>
  </Link>
);

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const { pathname, search } = useLocation();
  if (!user) return null;

  const isActive = (to) => pathname === to;

  useEffect(() => {
    let mounted = true;
    if (user.role === 'admin') {
      setPendingCount(0);
      return () => { mounted = false; };
    }
    const loadCounts = async () => {
      try {
        const res = await jobService.getJobs();
        const jobs = res.data || [];
        if (user.role === 'owner') {
          const myOwnerId = user._id;
          const count = jobs
            .filter(j => (typeof j.owner === 'string' ? j.owner : j.owner?._id) === myOwnerId)
            .reduce((acc, j) => acc + (j.applications || []).filter(a => a.status === 'pending').length, 0);
          if (mounted) setPendingCount(count);
        } else if (user.role === 'driver') {
          const myId = user._id;
          const count = jobs.reduce((acc, j) => {
            const app = (j.applications || []).find(a => (typeof a.driver === 'string' ? a.driver : a.driver?._id) === myId);
            return acc + (app && app.status === 'pending' ? 1 : 0);
          }, 0);
          if (mounted) setPendingCount(count);
        }
      } catch (_) {}
    };
    loadCounts();
    return () => { mounted = false; };
  }, [user]);

  const content = (
    <div className="p-4 w-64">
      <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Navigation</div>
      <div className="space-y-1">
        {user.role === 'admin' && (
          <>
            <NavItem
              to="/admin-dashboard"
              label="Admin Overview"
              active={isActive('/admin-dashboard')}
              onClick={onClose}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.75 4.5A2.25 2.25 0 0 1 6 2.25h12A2.25 2.25 0 0 1 20.25 4.5v15.75a.75.75 0 0 1-1.2.6L12 16.06l-7.05 4.79a.75.75 0 0 1-1.2-.6V4.5Z"/></svg>
              }
            />
          </>
        )}
        {user.role === 'driver' && (
          <>
            <NavItem
              to="/driver-dashboard"
              label="Browse Jobs"
              active={isActive('/driver-dashboard')}
              onClick={onClose}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M3.75 5.25A2.25 2.25 0 0 1 6 3h12a2.25 2.25 0 0 1 2.25 2.25v10.5A2.25 2.25 0 0 1 18 18H9.621a2.25 2.25 0 0 0-1.493.571L5.03 20.906A.75.75 0 0 1 3.75 20.31V5.25Z"/></svg>
              }
            />
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Quick Filters</div>
              <div className="space-y-1">
                <NavItem to="/driver-dashboard?my=1" label={
                  <span className="flex items-center justify-between w-full">My Applications {pendingCount > 0 && (<span className="ml-auto inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">{pendingCount}</span>)}</span>
                } active={isActive('/driver-dashboard') && new URLSearchParams(search).get('my') === '1'} onClick={onClose} icon={<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' className='h-5 w-5'><path d='M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75V12A2.25 2.25 0 0 1 17.25 14.25H8.31l-3.28 2.733A.75.75 0 0 1 4 16.875V6.75Z'/></svg>} />
                <NavItem to="/driver-dashboard?type=Car" label="Cars" active={isActive('/driver-dashboard') && new URLSearchParams(search).get('type') === 'Car'} onClick={onClose} icon={<span>🚗</span>} />
                <NavItem to="/driver-dashboard?type=Truck" label="Trucks" active={isActive('/driver-dashboard') && new URLSearchParams(search).get('type') === 'Truck'} onClick={onClose} icon={<span>🚚</span>} />
                <NavItem to="/driver-dashboard?type=Bus" label="Buses" active={isActive('/driver-dashboard') && new URLSearchParams(search).get('type') === 'Bus'} onClick={onClose} icon={<span>🚌</span>} />
              </div>
            </div>
            <NavItem
              to="/driver-profile"
              label="Profile"
              active={isActive('/driver-profile')}
              onClick={onClose}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a8.25 8.25 0 0 1 15 0 .75.75 0 0 1-.75.75h-13.5a.75.75 0 0 1-.75-.75Z"/></svg>
              }
            />
          </>
        )}

        {user.role === 'owner' && (
          <>
            <NavItem
              to="/owner-dashboard"
              label={
                <span className="flex items-center justify-between w-full">My Job Posts {pendingCount > 0 && (<span className="ml-auto inline-flex items-center justify-center text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">{pendingCount}</span>)}</span>
              }
              active={isActive('/owner-dashboard')}
              onClick={onClose}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5A2.25 2.25 0 0 1 17.25 19.5H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Z"/></svg>
              }
            />
            <div className="mt-3">
              <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Job Status</div>
              <div className="space-y-1">
                <NavItem to="/owner-dashboard?status=open" label="Open" active={isActive('/owner-dashboard') && new URLSearchParams(search).get('status') === 'open'} onClick={onClose} icon={<span className='h-2 w-2 rounded-full bg-green-500 inline-block' />} />
                <NavItem to="/owner-dashboard?status=closed" label="Closed" active={isActive('/owner-dashboard') && new URLSearchParams(search).get('status') === 'closed'} onClick={onClose} icon={<span className='h-2 w-2 rounded-full bg-gray-500 inline-block' />} />
              </div>
            </div>
            <NavItem
              to="/owner-dashboard?post=1"
              label="Post New Job"
              active={isActive('/owner-dashboard') && new URLSearchParams(search).get('post') === '1'}
              onClick={onClose}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 4.5a.75.75 0 0 1 .75.75V11h5.75a.75.75 0 0 1 0 1.5H12.75v5.75a.75.75 0 0 1-1.5 0V12.5H5.5a.75.75 0 0 1 0-1.5h5.75V5.25A.75.75 0 0 1 12 4.5Z"/></svg>
              }
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Menu</span>
              <button onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M6.225 4.811a.75.75 0 1 0-1.06 1.06L10.939 12l-5.774 6.129a.75.75 0 1 0 1.072 1.05L12 13.061l5.763 6.118a.75.75 0 1 0 1.074-1.046L13.061 12l5.774-6.129a.75.75 0 1 0-1.072-1.05L12 10.939 6.237 4.825a.75.75 0 0 0-.012-.014Z"/></svg>
              </button>
            </div>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`${open ? 'md:block' : 'md:hidden'} hidden md:block shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur min-h-[calc(100vh-56px)]`}>
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
