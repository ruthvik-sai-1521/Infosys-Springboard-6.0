import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { Car, MapPin, UserCircle, ChevronRight, TrendingUp, ShieldCheck, Mail, ChevronDown, DollarSign, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ earningsToday: 0, totalTrips: 0, averageRating: 4.8 });
    const [reviews, setReviews] = useState([]);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMessages, setShowMessages] = useState(false);
    const [expandedMessageId, setExpandedMessageId] = useState(null);
    const driverId = user?.id || 1;

    // Fetch messages
    const fetchMessages = async () => {
        try {
            const res = await axios.get(`/api/messages/${driverId}`);
            setMessages(res.data);
            
            // Fetch unread count
            const countRes = await axios.get(`/api/messages/unread-count/${driverId}`);
            setUnreadCount(countRes.data.count);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    // Mark message as read
    const markAsRead = async (messageId) => {
        try {
            await axios.put(`/api/messages/${messageId}/mark-read`);
            // Update local state
            setMessages(prev => prev.map(msg => 
                msg.id === messageId ? { ...msg, isRead: true } : msg
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Failed to mark message as read", err);
        }
    };

    // Toggle message expansion and mark as read
    const toggleMessage = (messageId, isRead) => {
        setExpandedMessageId(prev => prev === messageId ? null : messageId);
        if (!isRead) {
            markAsRead(messageId);
        }
    };

    // Format timestamp
    const formatTimestamp = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch driver info for real stats
                const driverRes = await axios.get(`/api/users/${driverId}`);
                const driverData = driverRes.data;
                
                setStats({
                    earningsToday: driverData.totalEarnings || 0,
                    totalTrips: driverData.completedTripsCount || 0,
                    averageRating: driverData.averageRating || 0.0
                });
                
                // Fetch Reviews
                const revRes = await axios.get(`/api/reviews/driver/${driverId}`);
                setReviews(revRes.data);
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            }
        };
        fetchStats();
        fetchMessages();

        // Polling for real-time updates (every 30 seconds)
        const interval = setInterval(() => {
            fetchMessages();
            fetchStats(); // Also refresh stats
        }, 30000);

        return () => clearInterval(interval);
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

                {/* 4. Messages Card */}
                <div 
                    onClick={() => setShowMessages(!showMessages)}
                    className="group bg-slate-900/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all cursor-pointer shadow-xl hover:shadow-amber-900/10 relative"
                >
                    {unreadCount > 0 && (
                        <div className="absolute top-4 right-4 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {unreadCount}
                        </div>
                    )}
                    <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Mail className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-amber-400 transition-colors">Messages</h3>
                    <p className="text-slate-400 text-sm mb-6">View messages from managers and stay updated.</p>
                    <div className="flex items-center text-amber-400 text-sm font-bold">
                        {showMessages ? 'Hide Messages' : 'View Messages'} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>

            </div>

            {/* QUICK STATS SECTION (Mock Data for Professional Feel) */}
            <div className="max-w-6xl mx-auto px-6 mt-16 animate-fade-in delay-100">
                <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-slate-500" /> Performance Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/10 p-4 rounded-xl border border-emerald-800/30">
                        <p className="text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3 h-3" /> Completed Earnings
                        </p>
                        <p className="text-2xl font-bold text-white mt-1">₹{stats.earningsToday.toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">From finished trips</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/10 p-4 rounded-xl border border-amber-800/30">
                        <p className="text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Earnings
                        </p>
                        <p className="text-2xl font-bold text-white mt-1">₹{(stats.pendingEarnings || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">From scheduled trips</p>
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
                    )))}
                </div>
            </div>

            {/* MESSAGES SECTION */}
            {showMessages && (
                <div className="max-w-6xl mx-auto px-6 mt-16 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-slate-500" /> Manager Messages
                        </h2>
                        {messages.length > 0 && (
                            <button
                                onClick={async () => {
                                    try {
                                        await axios.put(`/api/messages/mark-all-read/${driverId}`);
                                        setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
                                        setUnreadCount(0);
                                    } catch (err) {
                                        console.error("Failed to mark all as read", err);
                                    }
                                }}
                                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                    
                    {messages.length === 0 ? (
                        <div className="bg-slate-900/30 p-12 rounded-xl border border-slate-800/50 text-center">
                            <Mail className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500 italic">No messages yet</p>
                            <p className="text-slate-600 text-sm mt-2">Messages from managers will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    onClick={() => toggleMessage(msg.id, msg.isRead)}
                                    className={`bg-slate-900/30 p-5 rounded-xl border transition-all cursor-pointer ${
                                        msg.isRead 
                                            ? 'border-slate-800/50 hover:border-slate-700' 
                                            : 'border-blue-500/30 bg-blue-950/10 hover:border-blue-500/50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Sender Avatar */}
                                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-white">
                                                {msg.sender?.username?.[0]?.toUpperCase() || 'M'}
                                            </div>
                                            
                                            {/* Message Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-white text-sm">
                                                        {msg.sender?.username || 'Manager'}
                                                    </h4>
                                                    {!msg.isRead && (
                                                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-semibold">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-slate-400 text-xs mb-2">
                                                    {formatTimestamp(msg.sentAt)}
                                                </p>
                                                
                                                {/* Message Preview or Full Content */}
                                                <p className={`text-slate-300 text-sm ${
                                                    expandedMessageId === msg.id ? '' : 'line-clamp-2'
                                                }`}>
                                                    {msg.content}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Expand Icon */}
                                        <ChevronDown 
                                            className={`w-5 h-5 text-slate-500 transition-transform flex-shrink-0 ${
                                                expandedMessageId === msg.id ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default DriverDashboard;
