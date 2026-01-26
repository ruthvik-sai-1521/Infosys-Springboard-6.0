import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { Car, MapPin, UserCircle, ChevronRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ earningsToday: 0, totalTrips: 0, averageRating: 4.8 });
    const [reviews, setReviews] = useState([]);
    const driverId = user?.id || 1;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`/api/driver/${driverId}/analytics`);
                setStats(res.data);
                
                // Fetch Reviews
                const revRes = await axios.get(`/api/reviews/driver/${driverId}`);
                setReviews(revRes.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            }
        };
        fetchStats();
    }, [driverId]);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-20 font-sans">
            <Navbar />
            
            {/* HERO SECTION */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-900/20 to-transparent pointer-events-none"></div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{user?.username}</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Manage your fleet, schedule trips, and track your performance efficiently. 
                        Your command center for seamless transportation operations.
                    </p>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 -mt-10 relative z-20 animate-slide-up">
                
                {/* 1. Vehicles Card */}
                <div 
                    onClick={() => navigate('/driver/vehicles')}
                    className="group bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer shadow-xl hover:shadow-emerald-900/10"
                >
                    <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Car className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">My Fleet</h3>
                    <p className="text-slate-400 text-sm mb-6">Manage your vehicles, check fuel status, and track live locations.</p>
                    <div className="flex items-center text-emerald-400 text-sm font-bold">
                        Manage Vehicles <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* 2. Trips Card */}
                <div 
                    onClick={() => navigate('/driver/trips')}
                    className="group bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all cursor-pointer shadow-xl hover:shadow-blue-900/10"
                >
                    <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <MapPin className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">Trip Management</h3>
                    <p className="text-slate-400 text-sm mb-6">Post new trips, view upcoming schedules, and manage seat bookings.</p>
                    <div className="flex items-center text-blue-400 text-sm font-bold">
                        View Trips <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

                {/* 3. Profile Card */}
                <div 
                    onClick={() => navigate('/driver/profile')}
                    className="group bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all cursor-pointer shadow-xl hover:shadow-purple-900/10"
                >
                    <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <UserCircle className="w-7 h-7 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-400 transition-colors">Driver Profile</h3>
                    <p className="text-slate-400 text-sm mb-6">Update your personal details, documents, and profile picture.</p>
                    <div className="flex items-center text-purple-400 text-sm font-bold">
                        Edit Profile <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

            </div>

            {/* QUICK STATS SECTION (Mock Data for Professional Feel) */}
            <div className="max-w-6xl mx-auto px-6 mt-16 animate-fade-in delay-100">
                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" /> Performance Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Total Earnings</p>
                        <p className="text-2xl font-bold text-white mt-1">₹{stats.earningsToday.toLocaleString()}</p>
                        <p className="text-emerald-400 text-xs mt-1">▲ Lifetime</p>
                    </div>
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Trips Completed</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.totalTrips}</p>
                    </div>
                    <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Rating</p>
                        <p className="text-2xl font-bold text-white mt-1">{stats.averageRating || 5.0} <span className="text-sm text-slate-500">/ 5.0</span></p>
                    </div>
                     <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Acct Status</p>
                        <div className="flex items-center gap-2 mt-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="font-bold text-emerald-400">Verified</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* REVIEWS SECTION */}
            <div className="max-w-6xl mx-auto px-6 mt-16 animate-fade-in delay-200">
                 <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-slate-500" /> Recent Feedback
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.length === 0 ? (
                        <p className="text-slate-500 italic col-span-2">No reviews received yet.</p>
                    ) : (
                        reviews.map(r => (
                            <div key={r.id} className="bg-slate-900/30 p-5 rounded-xl border border-slate-800/50 flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">
                                    {r.customer?.username?.[0] || 'C'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white text-sm">{r.customer?.username || 'Customer'}</h4>
                                        <div className="flex text-amber-500 text-xs">{'★'.repeat(r.rating)}</div>
                                    </div>
                                    <p className="text-slate-400 text-sm">"{r.feedback}"</p>
                                    <p className="text-xs text-slate-600 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default DriverDashboard;
