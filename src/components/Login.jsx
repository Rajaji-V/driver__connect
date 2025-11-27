import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await login(formData);
            navigate(data.role === 'driver' ? '/driver-dashboard' : '/owner-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-xl shadow-md border border-gray-100 transition hover:shadow-lg">
                <div>
                    <h2 className="text-center text-3xl font-bold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="text-center text-sm text-gray-600 mt-1">Welcome back to DriverConnect</p>
                </div>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition"
                    >
                        Sign in
                    </button>
                    <div className="text-sm text-center mt-4">
                        <span className="text-gray-600">Don't have an account? </span>
                        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">Register</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
