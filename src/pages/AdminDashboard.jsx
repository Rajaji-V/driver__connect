import { useEffect, useState } from 'react';
import { adminService } from '../services/api';

const StatCard = ({ label, value, accent }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-50">{value}</p>
    {accent && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{accent}</p>}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getStats();
        setStats(res.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load admin stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>;
  }

  if (!stats) return null;

  const { users, jobs, applications } = stats;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Overview</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm">Platform-wide metrics for DriverConnect.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Users" value={users.total} />
        <StatCard label="Drivers" value={users.drivers} />
        <StatCard label="Vehicle Owners" value={users.owners} />
        <StatCard label="Admins" value={users.admins} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Jobs" value={jobs.total} />
        <StatCard label="Open Jobs" value={jobs.open} />
        <StatCard label="Closed Jobs" value={jobs.closed} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Applications" value={applications.total} />
        <StatCard label="Pending" value={applications.pending} />
        <StatCard label="Accepted" value={applications.accepted} />
        <StatCard label="Rejected" value={applications.rejected} />
      </div>
    </div>
  );
};

export default AdminDashboard;
