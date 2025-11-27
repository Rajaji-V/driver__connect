import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import DriverDashboard from './pages/DriverDashboard.jsx';
import DriverProfile from './pages/DriverProfile.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Navbar from './components/Navbar.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import Sidebar from './components/Sidebar.jsx';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100">
            <ToastProvider>
              {/* Sidebar state */}
              <SidebarStateWrapper />
            </ToastProvider>
          </div>
        </Router>
      </ErrorBoundary>
    </AuthProvider>
  );
}

// Extracted to manage sidebar state cleanly
function SidebarStateWrapper() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    if (saved != null) return saved === 'true';
    // default open on desktop
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 768px)').matches;
  });
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <>
      <Navbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className="flex-1">
                  <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/driver-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["driver"]}>
                        <DriverDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/driver-profile"
                    element={
                      <ProtectedRoute allowedRoles={["driver"]}>
                        <DriverProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/owner-dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["owner"]}>
                        <OwnerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/login" />} />
                  </Routes>
                </main>
      </div>
    </>
  );
}

export default App;
