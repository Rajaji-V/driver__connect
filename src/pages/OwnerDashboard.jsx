import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { jobService, uploadService, API_BASE } from '../services/api';
import { useToast } from '../components/ToastProvider.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { io } from 'socket.io-client';
import JobsMap from '../components/JobsMap.jsx';

const OwnerDashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { show } = useToast();
    const { user } = useAuth();
    const { search: qs } = useLocation();
    const [jobForm, setJobForm] = useState({
        title: '',
        description: '',
        vehicleType: '',
        location: '',
        latitude: '',
        longitude: '',
        salary: '',
        requirements: ''
    });
    const [vehiclePhotoFile, setVehiclePhotoFile] = useState(null);
    const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    useEffect(() => {
        const sp = new URLSearchParams(qs);
        const post = sp.get('post') === '1';
        if (post) setShowForm(true);
    }, [qs]);

        useEffect(() => {
                const SOCKET_ORIGIN = API_BASE || window.location.origin;
                const socket = io(SOCKET_ORIGIN, {
                    transports: ['websocket'],
                });

        const applyOwnerFilter = (allJobs) => {
          const all = allJobs || [];
          const mine = all.filter(j => {
            const ownerId = typeof j.owner === 'string' ? j.owner : j.owner?._id;
            return ownerId === user?._id;
          });
          const sp = new URLSearchParams(qs);
          const status = sp.get('status');
          return status ? mine.filter(j => j.status === status) : mine;
        };

        socket.on('job:created', (job) => {
          setJobs((prev) => applyOwnerFilter([...prev, job]));
        });

        socket.on('job:updated', (job) => {
          setJobs((prev) => applyOwnerFilter(prev.map((j) => (j._id === job._id ? job : j))));
        });

        socket.on('job:deleted', ({ id }) => {
          setJobs((prev) => prev.filter((j) => j._id !== id));
        });

        socket.on('job:applied', (job) => {
          setJobs((prev) => applyOwnerFilter(prev.map((j) => (j._id === job._id ? job : j))));
        });

        socket.on('job:applicationUpdated', (job) => {
          setJobs((prev) => applyOwnerFilter(prev.map((j) => (j._id === job._id ? job : j))));
        });

        return () => {
          socket.disconnect();
        };
    }, [qs, user?._id]);

    const fetchJobs = async () => {
        try {
            const response = await jobService.getJobs();
            const all = response.data || [];
            // Only show jobs owned by the logged-in owner
            const mine = all.filter(j => {
              const ownerId = typeof j.owner === 'string' ? j.owner : j.owner?._id;
              return ownerId === user?._id;
            });
            // Optional status filter from URL
            const sp = new URLSearchParams(qs);
            const status = sp.get('status');
            const filtered = status ? mine.filter(j => j.status === status) : mine;
            setJobs(filtered);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch jobs');
            setLoading(false);
        }
    };

    const handleFormChange = (e) => {
        setJobForm({
            ...jobForm,
            [e.target.name]: e.target.value
        });
    };

    const handleVehiclePhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png'];
        if (!allowed.includes(file.type)) {
            show('Only JPEG and PNG images are allowed', 'error');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            show('Image must be 2MB or less', 'error');
            return;
        }
        setVehiclePhotoFile(file);
        setVehiclePhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...jobForm };
            if (payload.latitude === '') delete payload.latitude;
            if (payload.longitude === '') delete payload.longitude;
            if (vehiclePhotoFile) {
                const up = await uploadService.uploadFile(vehiclePhotoFile);
                payload.vehiclePhoto = up.url;
            }
            await jobService.createJob(payload);
            setShowForm(false);
            setJobForm({
                title: '',
                description: '',
                vehicleType: '',
                location: '',
                latitude: '',
                longitude: '',
                salary: '',
                requirements: ''
            });
            setVehiclePhotoFile(null);
            setVehiclePhotoPreview('');
            fetchJobs();
            show('Job posted successfully', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create job');
            show(err.response?.data?.message || 'Failed to create job', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApplicationStatus = async (jobId, applicationId, status) => {
        try {
            if (!window.confirm(`Are you sure you want to ${status} this application?`)) return;
            await jobService.updateApplication(jobId, applicationId, status);
            fetchJobs();
            show(`Application ${status}`, 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update application status');
            show(err.response?.data?.message || 'Failed to update application status', 'error');
        }
    };

    const handleDeleteJob = async (jobId) => {
        try {
            if (!window.confirm('Delete this job post? This cannot be undone.')) return;
            await jobService.deleteJob(jobId);
            fetchJobs();
            show('Job deleted', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete job');
            show(err.response?.data?.message || 'Failed to delete job', 'error');
        }
    };

    const handleToggleStatus = async (job) => {
        try {
            const next = job.status === 'open' ? 'closed' : 'open';
            if (!window.confirm(`Set job status to ${next}?`)) return;
            await jobService.updateJobStatus(job._id, next);
            fetchJobs();
            show(`Job marked as ${next}`, 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update job status');
            show(err.response?.data?.message || 'Failed to update job status', 'error');
        }
    };

    if (loading) return (
        <div className="container mx-auto p-4">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-pulse">
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

    return (
        <div className="container mx-auto p-4">
            <JobsMap jobs={jobs} />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Job Listings</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {showForm ? 'Cancel' : 'Post New Job'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Job Title</label>
                        <input
                            type="text"
                            name="title"
                            value={jobForm.title}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Latitude (optional)</label>
                            <input
                                type="number"
                                step="any"
                                name="latitude"
                                value={jobForm.latitude}
                                onChange={handleFormChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Longitude (optional)</label>
                            <input
                                type="number"
                                step="any"
                                name="longitude"
                                value={jobForm.longitude}
                                onChange={handleFormChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            name="description"
                            value={jobForm.description}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            rows="3"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vehicle Photo (optional)</label>
                        <input type="file" accept="image/*" onChange={handleVehiclePhoto} className="mt-1 block w-full" />
                        {vehiclePhotoPreview && (
                            <img src={vehiclePhotoPreview} alt="Vehicle preview" className="mt-2 h-28 w-auto rounded border" />
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                        <input
                            type="text"
                            name="vehicleType"
                            value={jobForm.vehicleType}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={jobForm.location}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Salary</label>
                        <input
                            type="number"
                            name="salary"
                            value={jobForm.salary}
                            onChange={handleFormChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {submitting ? 'Posting...' : 'Post Job'}
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {jobs.length === 0 && (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-gray-400"><path d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h2.379a2.25 2.25 0 0 0 1.59-.659l1.5-1.5a2.25 2.25 0 0 1 1.59-.659H15"/><path d="M8.25 9.75H9A2.25 2.25 0 0 1 11.25 12v8.25"/><path d="M18 12.75v-6a2.25 2.25 0 0 0-2.25-2.25h-6"/><path d="M2.25 19.5h19.5"/></svg>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">No job posts yet</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Click "Post New Job" to create your first listing.</p>
                  </div>
                )}
                {jobs.map((job) => (
                    <div key={job._id} className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                                {job.vehiclePhoto && (
                                                    <img
                                                        src={job.vehiclePhoto.startsWith('http') ? job.vehiclePhoto : `${API_BASE}${job.vehiclePhoto}`}
                                                        alt="Vehicle"
                                                        className="mb-3 w-full h-40 object-cover rounded border"
                                                    />
                                                )}
                        <h2 className="text-xl font-semibold">{job.title}</h2>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {job.status === 'open' ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="text-gray-600">{job.description}</p>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                            <p><strong>Vehicle Type:</strong> {job.vehicleType}</p>
                            <p><strong>Location:</strong> {job.location}</p>
                            <p><strong>Salary:</strong> ₹{job.salary}</p>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button
                                onClick={() => handleDeleteJob(job._id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                                Delete Post
                            </button>
                            <button
                                onClick={() => handleToggleStatus(job)}
                                className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-900"
                            >
                                {job.status === 'open' ? 'Close Post' : 'Reopen Post'}
                            </button>
                        </div>
                        
                        <div className="mt-6">
                            <h3 className="font-semibold">Applications</h3>
                            {job.applications.length === 0 ? (
                                <p className="text-gray-500">No applications yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {job.applications.map((app) => (
                                        <div key={app._id} className="border-b py-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="font-medium">{app.name || app.driver?.name || 'Driver'}</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700 mt-1">
                                                        {app.mobileNumber && <p><strong>Mobile:</strong> {app.mobileNumber}</p>}
                                                        {app.age !== undefined && <p><strong>Age:</strong> {app.age}</p>}
                                                        {app.licenseNumber && <p><strong>License No:</strong> {app.licenseNumber}</p>}
                                                        {Array.isArray(app.vehicleExpertise) && app.vehicleExpertise.length > 0 && (
                                                            <p><strong>Expertise:</strong> {app.vehicleExpertise.join(', ')}</p>
                                                        )}
                                                        {app.experience !== undefined && <p><strong>Experience:</strong> {app.experience} years</p>}
                                                        {app.preferredArea && <p><strong>Preferred Area:</strong> {app.preferredArea}</p>}
                                                        {app.expectedSalary !== undefined && <p><strong>Expected Salary:</strong> ₹{app.expectedSalary}</p>}
                                                        {app.available !== undefined && <p><strong>Available:</strong> {app.available ? 'Yes' : 'No'}</p>}
                                                        {(app.licensePhoto || app.idProof) && (
                                                          <div className="col-span-2 mt-2 flex items-center gap-4">
                                                                                                                        {app.licensePhoto && (
                                                                                                                            <a href={app.licensePhoto.startsWith('http') ? app.licensePhoto : `${API_BASE}${app.licensePhoto}`} target="_blank" rel="noreferrer" className="block">
                                                                                                                                <img src={app.licensePhoto.startsWith('http') ? app.licensePhoto : `${API_BASE}${app.licensePhoto}`} alt="License" className="h-16 w-24 object-cover rounded border" />
                                                                                                                                <span className="block text-xs text-gray-500 mt-1">License Photo</span>
                                                                                                                            </a>
                                                                                                                        )}
                                                                                                                        {app.idProof && (
                                                                                                                            <a href={app.idProof.startsWith('http') ? app.idProof : `${API_BASE}${app.idProof}`} target="_blank" rel="noreferrer" className="block">
                                                                                                                                <img src={app.idProof.startsWith('http') ? app.idProof : `${API_BASE}${app.idProof}`} alt="ID Proof" className="h-16 w-24 object-cover rounded border" />
                                                                                                                                <span className="block text-xs text-gray-500 mt-1">ID Proof</span>
                                                                                                                            </a>
                                                                                                                        )}
                                                          </div>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">Applied: {new Date(app.appliedAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="space-x-2 shrink-0">
                                                    {app.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApplicationStatus(job._id, app._id, 'accepted')}
                                                                className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleApplicationStatus(job._id, app._id, 'rejected')}
                                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
                                                    {app.status !== 'pending' && (
                                                        <span className={`px-2 py-1 rounded text-sm ${
                                                            app.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OwnerDashboard;
