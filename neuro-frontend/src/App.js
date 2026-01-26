import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverVehiclesPage from './pages/driver/DriverVehiclesPage';
import DriverTripsPage from './pages/driver/DriverTripsPage';
import DriverProfilePage from './pages/driver/DriverProfile';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import AdminLayout from './layouts/AdminLayout';
import AdminDriverPage from './pages/admin/AdminDriverPage';
import AdminTripPage from './pages/admin/AdminTripPage';
import AdminCustomerPage from './pages/admin/AdminCustomerPage';

// --- AXIOS GLOBAL CONFIGURATION ---
axios.defaults.baseURL = 'http://localhost:8080';

// Add a request interceptor to attach the token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Assuming AuthContext saves to localStorage 'token'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Protected Route Component

// Protected Route Component
const PrivateRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role?.toUpperCase())) return <Navigate to="/login" />; // Or unauthorized page
    return children;
};

// Placeholder Dashboards
const Dashboard = ({ title }) => (
    <div className="min-h-screen bg-slate-950 text-white p-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{title}</h1>
        <p className="mt-4 text-slate-400">Welcome to your dashboard. Integration coming soon.</p>
    </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <PrivateRoute allowedRoles={['CUSTOMER']}>
                    <CustomerDashboard />
                </PrivateRoute>
            } />
            <Route path="/admin/*" element={
                <PrivateRoute allowedRoles={['ADMIN']}>
                    <AdminLayout>
                        <Routes>
                            <Route index element={<Navigate to="drivers" replace />} />
                            <Route path="drivers" element={<AdminDriverPage />} />
                            <Route path="trips" element={<AdminTripPage />} />
                            <Route path="customers" element={<AdminCustomerPage />} />
                        </Routes>
                    </AdminLayout>
                </PrivateRoute>
            } />
             <Route path="/manager" element={
                <PrivateRoute allowedRoles={['MANAGER']}>
                    <ManagerDashboard />
                </PrivateRoute>
            } />
            <Route path="/driver" element={
                <PrivateRoute allowedRoles={['DRIVER']}>
                    <DriverDashboard />
                </PrivateRoute>
            } />
            <Route path="/driver/vehicles" element={
                <PrivateRoute allowedRoles={['DRIVER']}>
                    <div className="min-h-screen bg-slate-950 pt-20">
                         <DriverVehiclesPage />
                    </div>
                </PrivateRoute>
            } />
            <Route path="/driver/trips" element={
                <PrivateRoute allowedRoles={['DRIVER']}>
                    <div className="min-h-screen bg-slate-950 pt-20">
                         <DriverTripsPage />
                    </div>
                </PrivateRoute>
            } />
            <Route path="/driver/profile" element={
                <PrivateRoute allowedRoles={['DRIVER']}>
                    <div className="min-h-screen bg-slate-950 pt-20">
                         <DriverProfilePage />
                    </div>
                </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;