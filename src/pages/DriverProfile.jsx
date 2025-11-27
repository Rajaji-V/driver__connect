import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, uploadService } from '../services/api';
import { useToast } from '../components/ToastProvider.jsx';

const DriverProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();
  const [form, setForm] = useState({
    name: '',
    age: '',
    mobileNumber: '',
    licenseNumber: '',
    vehicleExpertise: '',
    experience: '',
    preferredArea: '',
    expectedSalary: '',
    available: true,
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [licensePreview, setLicensePreview] = useState('');
  const [idPreview, setIdPreview] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await profileService.getMyProfile();
        if (res.data) {
          setForm({
            name: res.data.name ?? '',
            age: res.data.age ?? '',
            mobileNumber: res.data.mobileNumber ?? '',
            licenseNumber: res.data.licenseNumber ?? '',
            vehicleExpertise: (res.data.vehicleExpertise || []).join(', '),
            experience: res.data.experience ?? '',
            preferredArea: res.data.preferredArea ?? '',
            expectedSalary: res.data.expectedSalary ?? '',
            available: res.data.available ?? true,
          });
          if (res.data.licensePhoto) setLicensePreview(res.data.licensePhoto);
          if (res.data.idProof) setIdPreview(res.data.idProof);
        }
      } catch (_) {
        // 404 is fine (no profile yet)
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (e, kind) => {
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
    if (kind === 'license') {
      setLicenseFile(file);
      setLicensePreview(URL.createObjectURL(file));
    } else {
      setIdFile(file);
      setIdPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const name = (form.name || '').trim();
    const age = Number(form.age);
    const exp = Number(form.experience);
    const salary = Number(form.expectedSalary);
    const mobile = (form.mobileNumber || '').trim();
    // Basic validations
    if (!name) return 'Name is required';
    if (!/^\+?[0-9]{7,15}$/.test(mobile)) return 'Enter a valid mobile number (7-15 digits, optional +)';
    if (isNaN(age) || age < 18 || age > 75) return 'Age must be between 18 and 75';
    if (isNaN(exp) || exp < 0 || exp > 60) return 'Experience must be between 0 and 60 years';
    if (isNaN(salary) || salary <= 0) return 'Expected salary must be a positive number';
    if (!form.licenseNumber.trim()) return 'License number is required';
    if (!form.preferredArea.trim()) return 'Preferred area is required';
    if (!form.vehicleExpertise.trim()) return 'Vehicle expertise is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        age: Number(form.age),
        mobileNumber: form.mobileNumber.trim(),
        licenseNumber: form.licenseNumber.trim(),
        vehicleExpertise: form.vehicleExpertise
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(form.experience),
        preferredArea: form.preferredArea.trim(),
        expectedSalary: Number(form.expectedSalary),
        available: !!form.available,
      };
      // Upload files if selected
      if (licenseFile) {
        const up = await uploadService.uploadFile(licenseFile);
        payload.licensePhoto = up.url;
      }
      if (idFile) {
        const up = await uploadService.uploadFile(idFile);
        payload.idProof = up.url;
      }
      await profileService.upsertMyProfile(payload);
      show('Profile saved successfully', 'success');
      navigate('/driver-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
      // optional toast
      // show('Failed to save profile', 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Driver Profile</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="tel"
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="e.g., 9876543210"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">License Number</label>
          <input
            type="text"
            name="licenseNumber"
            value={form.licenseNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload License Photo</label>
            <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'license')} className="mt-1 block w-full" />
            {licensePreview && (
              <img src={licensePreview} alt="License preview" className="mt-2 h-28 w-auto rounded border" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Upload ID Proof</label>
            <input type="file" accept="image/*" onChange={(e) => handleFile(e, 'id')} className="mt-1 block w-full" />
            {idPreview && (
              <img src={idPreview} alt="ID preview" className="mt-2 h-28 w-auto rounded border" />
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle Expertise (comma separated)</label>
          <input
            type="text"
            name="vehicleExpertise"
            value={form.vehicleExpertise}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="e.g., Car, Truck, Bus"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
          <input
            type="number"
            name="experience"
            value={form.experience}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Preferred Area</label>
          <input
            type="text"
            name="preferredArea"
            value={form.preferredArea}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Expected Salary</label>
          <input
            type="number"
            name="expectedSalary"
            value={form.expectedSalary}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="available"
            type="checkbox"
            name="available"
            checked={form.available}
            onChange={handleChange}
            className="h-4 w-4"
          />
          <label htmlFor="available" className="text-sm text-gray-700">Available for jobs</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save Profile'}
          </button>
          <button type="button" onClick={() => navigate('/driver-dashboard')} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default DriverProfile;
