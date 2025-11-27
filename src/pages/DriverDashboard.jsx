import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jobService, API_BASE } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { io } from 'socket.io-client';
import JobsMap from '../components/JobsMap.jsx';

const DriverDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [search, setSearch] = useState('');
    const [vehicleType, setVehicleType] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { search: qs } = useLocation();
    const { show } = useToast();

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        const SOCKET_ORIGIN = API_BASE || window.location.origin;
        const socket = io(SOCKET_ORIGIN, {
          transports: ['websocket'],
        });

        socket.on('job:created', (job) => {
          setJobs((prev) => [...prev, job]);
        });

        socket.on('job:updated', (job) => {
          setJobs((prev) => prev.map((j) => (j._id === job._id ? job : j)));
        });

        socket.on('job:deleted', ({ id }) => {
          setJobs((prev) => prev.filter((j) => j._id !== id));
        });

        socket.on('job:applied', (job) => {
          setJobs((prev) => prev.map((j) => (j._id === job._id ? job : j)));
        });

        socket.on('job:applicationUpdated', (job) => {
          setJobs((prev) => prev.map((j) => (j._id === job._id ? job : j)));
        });

        return () => {
          socket.disconnect();
        };
    }, []);

    useEffect(() => {
        const sp = new URLSearchParams(qs);
        const type = sp.get('type') || '';
        const my = sp.get('my') === '1';
        setVehicleType(type);
        // when my=1, we don't change local state, we filter later via flag
        setShowOnlyMine(my);
    }, [qs]);

    const fetchJobs = async () => {
        try {
            const response = await jobService.getJobs();
            setJobs(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch jobs');
            setLoading(false);
        }
    };

    const handleApply = async (jobId) => {
        try {
            await jobService.applyForJob(jobId);
            fetchJobs(); // Refresh jobs list
            show('Applied successfully', 'success');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to apply for job';
            setError(msg);
            show(msg, 'error');
            if (err.response?.status === 400 && msg.toLowerCase().includes('profile')) {
                navigate('/driver-profile');
            }
        }
    };

    if (loading) return (
      <div className="container mx-auto p-4">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm bg-white dark:bg-gray-800 animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-1" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
    if (error) return <div className="text-red-500">{error}</div>;

    const vehicleTypes = Array.from(new Set(jobs.map(j => j.vehicleType))).filter(Boolean);
    const filteredJobs = jobs.filter(j => {
        const matchesSearch = [j.title, j.description, j.location]
            .filter(Boolean)
            .some(v => v.toLowerCase().includes(search.toLowerCase()));
        const matchesType = vehicleType ? (j.vehicleType || '').toLowerCase() === vehicleType.toLowerCase() : true;
        if (!matchesSearch || !matchesType) return false;
        if (!showOnlyMine) return true;
        // show only jobs I applied to
        const myApp = (j.applications || []).find(app => {
          const driverId = typeof app.driver === 'string' ? app.driver : app.driver?._id;
          return driverId === user._id;
        });
        return !!myApp;
    });

    return (
        <div className="container mx-auto p-4">
            <JobsMap jobs={filteredJobs} />
            <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">Available Jobs</h1>
                  <p className="text-gray-600">Find and apply to opportunities that match your skills.</p>
                </div>
                <button
                  onClick={() => navigate('/driver-profile')}
                  className="h-9 px-3 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800"
                >
                  Edit Profile
                </button>
            </div>
            <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Search by title, description, or location..."
                  className="col-span-2 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="">All vehicle types</option>
                  {vehicleTypes.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.length === 0 && (
                  <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-gray-400"><path d="M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v9.5A2.25 2.25 0 0 1 18.75 17H8.31l-3.28 2.733A.75.75 0 0 1 4 19.125V17H5.25A2.25 2.25 0 0 1 3 14.75v-9.5Z"/></svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">No matching jobs</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Try adjusting filters or check back later.</p>
                  </div>
                )}
                {filteredJobs.map((job) => (
                    <div key={job._id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm bg-white dark:bg-gray-800 transition hover:shadow-md hover:-translate-y-0.5">
                        {job.vehiclePhoto && (
                          <img
                            src={job.vehiclePhoto.startsWith('http') ? job.vehiclePhoto : `${API_BASE}${job.vehiclePhoto}`}
                            alt="Vehicle"
                            className="mb-3 w-full h-40 object-cover rounded border"
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-semibold">{job.title}</h2>
                          <span className={`px-2 py-0.5 rounded text-xs ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {job.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="text-gray-600">{job.description}</p>
                        <div className="mt-4">
                            <p><strong>Vehicle Type:</strong> {job.vehicleType}</p>
                            <p><strong>Location:</strong> {job.location}</p>
                            <p><strong>Salary:</strong> ₹{job.salary}</p>
                        </div>
                        {(() => {
                            const myApp = job.applications.find(app => {
                                const driverId = typeof app.driver === 'string' ? app.driver : app.driver?._id;
                                return driverId === user._id;
                            });
                            const hasApplied = !!myApp;
                            const canApply = !hasApplied && job.status === 'open';
                            return (
                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        onClick={() => handleApply(job._id)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                                        disabled={!canApply}
                                    >
                                        {hasApplied ? 'Applied' : (job.status === 'open' ? 'Apply Now' : 'Closed')}
                                    </button>
                                    {hasApplied && (
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            myApp.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            myApp.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {myApp.status.charAt(0).toUpperCase() + myApp.status.slice(1)}
                                        </span>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriverDashboard;
