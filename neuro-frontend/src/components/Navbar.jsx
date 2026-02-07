import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';

import DriverAlertsNotification from './DriverAlertsNotification';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 h-16 flex items-center justify-between px-6 md:px-10">
            {/* Project Name */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                    N
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    NeuroFleetX
                </span>
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-6">
                {user ? (
                    <div className="flex items-center gap-4">
                        {/* Driver Alerts */}
                        {user.role === 'DRIVER' && <DriverAlertsNotification driverId={user.id} />}

                        <div className="relative">
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 text-slate-300 hover:text-white transition-colors focus:outline-none"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                                <User className="w-4 h-4 text-slate-300" />
                            </div>
                            <span className="text-sm font-medium">{user.username}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>

                        {/* Dropdown */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-1 origin-top-right transform transition-all animate-fade-in">
                                <Link to={`/${user?.role?.toLowerCase()}`} className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
                                    Dashboard
                                </Link>
                                <button 
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                    </div>
                ) : (
                    <div className="space-x-4">
                        <Link to="/login" className="text-slate-300 hover:text-white transition">Login</Link>
                        <Link to="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">Get Started</Link>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;