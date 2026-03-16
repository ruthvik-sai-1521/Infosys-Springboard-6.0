import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import {
    Phone, MessageSquare, X, MapPin, Clock, AlertCircle, Gauge,
    Search, Calendar, Car, Star, TrendingUp, CheckCircle2,
    Zap, ChevronRight, Ticket, ArrowRight, LayoutDashboard
} from 'lucide-react';
import { VehicleTracker } from '../../components/maps';

// ─── Vehicle type config ───────────────────────────────────────────────────
const VEHICLE_TYPES = [
    { key: 'ALL',      label: 'All Types', emoji: '🚘', color: 'bg-slate-700 border-slate-600 text-slate-300' },
    { key: 'EV',       label: 'EV',        emoji: '⚡', color: 'bg-emerald-900/60 border-emerald-600/50 text-emerald-300' },
    { key: 'SEDAN',    label: 'Sedan',     emoji: '🚗', color: 'bg-blue-900/60 border-blue-600/50 text-blue-300' },
    { key: 'SUV',      label: 'SUV',       emoji: '🚙', color: 'bg-purple-900/60 border-purple-600/50 text-purple-300' },
    { key: 'HATCHBACK',label: 'Hatchback', emoji: '🚕', color: 'bg-orange-900/60 border-orange-600/50 text-orange-300' },
];

const vehicleBadge = (type) => {
    const t = VEHICLE_TYPES.find(v => v.key === (type || '').toUpperCase()) || VEHICLE_TYPES[0];
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.color}`}>{t.emoji} {t.label}</span>;
};

const statusColors = {
    CONFIRMED:      'text-emerald-400 bg-emerald-900/40 border-emerald-700/50',
    PENDING:        'text-yellow-400 bg-yellow-900/40 border-yellow-700/50',
    COMPLETED:      'text-blue-400 bg-blue-900/40 border-blue-700/50',
    AUTO_COMPLETED: 'text-blue-400 bg-blue-900/40 border-blue-700/50',
    CANCELLED:      'text-red-400 bg-red-900/40 border-red-700/50',
};

const isCompleted = (b) =>
    b.status === 'COMPLETED' || b.status === 'AUTO_COMPLETED' ||
    b.trip?.status === 'COMPLETED' || b.trip?.status === 'AUTO_COMPLETED' ||
    (b.trip?.tripDate && new Date(b.trip.tripDate) < new Date() && b.status !== 'PENDING');

const isOngoing = (b) =>
    (b.status === 'CONFIRMED' || b.status === 'PENDING') &&
    b.trip?.status !== 'COMPLETED' && b.trip?.status !== 'AUTO_COMPLETED' &&
    b.trip?.tripDate && new Date(b.trip.tripDate) >= new Date();

// ─── Main Component ────────────────────────────────────────────────────────
const CustomerDashboard = () => {
    const { user } = useAuth();
    const customerId = user?.id || 2;
    const [activeTab, setActiveTab] = useState('dashboard');

    // Search
    const [pickup, setPickup]     = useState('');
    const [dropoff, setDropoff]   = useState('');
    const [results, setResults]   = useState([]);
    const [searched, setSearched] = useState(false);
    const [vehicleFilter, setVehicleFilter] = useState('ALL');

    // Bookings
    const [bookings, setBookings] = useState([]);

    // Booking confirmation
    const [bookingLoading, setBookingLoading] = useState(null); // tripId being booked

    // Review
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewBooking,   setReviewBooking]   = useState(null);
    const [rating,   setRating]   = useState(0);
    const [feedback, setFeedback] = useState('');

    // Tracking
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingBooking,     setTrackingBooking]     = useState(null);
    const [trackingData,        setTrackingData]        = useState(null);
    const [trackingError,       setTrackingError]       = useState(null);
    const [loadingTracking,     setLoadingTracking]     = useState(false);

    // ── data fetching ──────────────────────────────────────────────────────
    const fetchBookings = () => {
        if (!customerId) return;
        axios.get(`/api/bookings/customer/${customerId}`)
            .then(res => setBookings(res.data))
            .catch(err => console.error(err));
    };

    useEffect(() => { fetchBookings(); }, [customerId]); // eslint-disable-line

    // ── derived stats ──────────────────────────────────────────────────────
    const completedBookings  = useMemo(() => bookings.filter(isCompleted),  [bookings]);
    const ongoingBookings    = useMemo(() => bookings.filter(isOngoing),    [bookings]);
    const cancelledBookings  = useMemo(() => bookings.filter(b => b.status === 'CANCELLED'), [bookings]);
    const totalSpent         = useMemo(() => bookings.reduce((s, b) => s + (b.fare || 0), 0), [bookings]);

    const upcomingThisWeek = useMemo(() => {
        const now  = new Date();
        const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return ongoingBookings.filter(b => {
            const d = new Date(b.trip?.tripDate);
            return d >= now && d <= week;
        });
    }, [ongoingBookings]);

    // ── search ─────────────────────────────────────────────────────────────
    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`/api/trips/search?source=${pickup}&destination=${dropoff}`);
            setResults(res.data);
            setSearched(true);
            setVehicleFilter('ALL');
        } catch (err) { console.error(err); }
    };

    const filteredResults = useMemo(() =>
        vehicleFilter === 'ALL' ? results
            : results.filter(t => (t.vehicle?.type || '').toUpperCase() === vehicleFilter),
        [results, vehicleFilter]);

    // ── book now (no seat selection) ────────────────────────────────────────
    const confirmBooking = async (trip) => {
        setBookingLoading(trip.id);
        try {
            await axios.post('/api/bookings/book', {
                tripId: trip.id,
                customerId,
                seatNumbers: [] // no seat selection
            });
            alert('Booking Confirmed! Have a great trip 🎉');
            setSearched(false);
            fetchBookings();
            setActiveTab('bookings');
        } catch (error) {
            alert('Booking Failed: ' + (error.response?.data?.error || error.message));
        }
        setBookingLoading(null);
    };

    // ── review ─────────────────────────────────────────────────────────────
    const openReview = (booking) => {
        setReviewBooking(booking); setRating(0); setFeedback(''); setReviewModalOpen(true);
    };
    const submitReview = async () => {
        if (!reviewBooking || rating === 0) return;
        try {
            await axios.post('/api/reviews/submit', {
                tripId: reviewBooking.trip.id, customerId, rating, feedback
            });
            alert('Review Submitted! Thank you.');
            setReviewModalOpen(false);
        } catch (error) {
            alert('Failed to submit review: ' + (error.response?.data?.error || error.message));
        }
    };

    // ── tracking ───────────────────────────────────────────────────────────
    const handleTrackVehicle = async (booking) => {
        setTrackingBooking(booking); setIsTrackingModalOpen(true);
        setLoadingTracking(true); setTrackingData(null); setTrackingError(null);
        try {
            const res = await axios.get(`/api/bookings/${booking.id}/track?customerId=${customerId}`);
            const data = res.data;
            if (!data.trackingAvailable) {
                setTrackingError({ reason: data.reason, message: data.message, availableFrom: data.availableFrom, endedAt: data.endedAt });
            } else { setTrackingData(data); }
        } catch (err) {
            setTrackingError({ reason: 'error', message: err.response?.data?.error || 'Failed to load tracking information' });
        }
        setLoadingTracking(false);
    };

    const canTrack = (b) =>
        b.status === 'CONFIRMED' || b.trip?.status === 'IN_PROGRESS';

    // ── helpers ────────────────────────────────────────────────────────────
    const formatDateTime = (dt) => {
        if (!dt) return 'N/A';
        return new Date(dt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const decodePolyline = (encoded) => {
        if (!encoded) return [];
        const poly = []; let index = 0, len = encoded.length, lat = 0, lng = 0;
        while (index < len) {
            let b, shift = 0, result = 0;
            do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
            shift = 0; result = 0;
            do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
            poly.push([lat * 1e-5, lng * 1e-5]);
        }
        return poly;
    };

    // ── booking card ───────────────────────────────────────────────────────
    const BookingCard = ({ b }) => (
        <div className="glass-card p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all group">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-base font-bold text-white truncate">
                            {b.pickupLoc} <span className="text-slate-500">➡</span> {b.dropoffLoc}
                        </h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColors[b.status] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                            {b.status}
                        </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>Booking #{b.id}</span>
                        {b.trip?.tripDate && <span><Calendar className="w-3 h-3 inline mr-1"/>{formatDateTime(b.trip.tripDate)}</span>}
                    </div>
                    {b.trip?.vehicle?.type && <div className="mt-2">{vehicleBadge(b.trip.vehicle.type)}</div>}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {/* Track only for ongoing/upcoming, NOT completed */}
                        {canTrack(b) && !isCompleted(b) && (
                            <button onClick={() => handleTrackVehicle(b)}
                                className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                                <MapPin className="w-3 h-3"/> Track Vehicle
                            </button>
                        )}
                        {isCompleted(b) && (
                            <button onClick={() => openReview(b)}
                                className="text-xs font-bold bg-slate-800 hover:bg-yellow-500/20 text-slate-300 hover:text-yellow-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-all flex items-center gap-1">
                                <Star className="w-3 h-3"/> Rate Trip
                            </button>
                        )}
                    </div>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-white">₹{b.fare?.toFixed(0)}</p>
                    <p className="text-xs text-slate-400">1 Booking</p>
                </div>
            </div>
        </div>
    );

    // ── tabs ───────────────────────────────────────────────────────────────
    const tabs = [
        { key: 'dashboard', label: 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4"/> },
        { key: 'search',    label: 'Search Rides', icon: <Search className="w-4 h-4"/> },
        { key: 'bookings',  label: 'My Bookings',  icon: <Ticket className="w-4 h-4"/> },
    ];

    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="max-w-5xl mx-auto pt-24 px-4 pb-24">

                {/* ── Tab Bar ── */}
                <div className="flex gap-1 mb-8 bg-slate-900/60 border border-slate-800 p-1 rounded-2xl w-fit mx-auto">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                                ${activeTab === t.key
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                            {t.icon}{t.label}
                            {t.key === 'bookings' && bookings.length > 0 &&
                                <span className="ml-1 bg-slate-700 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {bookings.length}
                                </span>}
                        </button>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════
                    TAB: DASHBOARD
                ════════════════════════════════════════════════ */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-fade-in">

                        {/* Welcome / Profile Card */}
                        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 p-6 shadow-xl">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none"/>
                            <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-900/40 shrink-0">
                                        {(user?.username || 'C').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm font-medium">Welcome back,</p>
                                        <h1 className="text-3xl font-black text-white tracking-tight">
                                            {user?.username || 'Customer'}
                                        </h1>
                                        <p className="text-slate-500 text-xs mt-1">{user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('search')}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-900/30 transition-all active:scale-95">
                                    <Search className="w-4 h-4"/> Book a Trip <ChevronRight className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Trips Completed', value: completedBookings.length, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400"/>, color: 'text-emerald-400' },
                                { label: 'Total Bookings',  value: bookings.length,          icon: <Ticket className="w-5 h-5 text-blue-400"/>,    color: 'text-blue-400' },
                                { label: 'Ongoing / Upcoming', value: ongoingBookings.length,  icon: <Car className="w-5 h-5 text-purple-400"/>,   color: 'text-purple-400' },
                                { label: 'Total Spent',     value: `₹${totalSpent.toFixed(0)}`, icon: <TrendingUp className="w-5 h-5 text-yellow-400"/>, color: 'text-yellow-400' },
                            ].map(s => (
                                <div key={s.label} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors">
                                    <div className="flex items-center justify-between">
                                        {s.icon}
                                        <span className={`text-2xl font-black ${s.color}`}>{s.value}</span>
                                    </div>
                                    <p className="text-slate-500 text-xs font-medium">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Upcoming Trips Calendar Widget */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-white flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-400"/> Upcoming This Week
                                </h2>
                                {ongoingBookings.length > 0 &&
                                    <button onClick={() => setActiveTab('bookings')}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                        View All <ArrowRight className="w-3 h-3"/>
                                    </button>}
                            </div>
                            {upcomingThisWeek.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-2"/>
                                    <p className="text-slate-500 text-sm">No upcoming trips this week</p>
                                    <button onClick={() => setActiveTab('search')}
                                        className="mt-3 text-xs text-blue-400 hover:underline flex items-center gap-1 mx-auto">
                                        Find a ride <ChevronRight className="w-3 h-3"/>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {upcomingThisWeek.map(b => (
                                        <div key={b.id} className="flex items-center gap-4 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                                                <Car className="w-5 h-5 text-white"/>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-semibold text-sm truncate">{b.pickupLoc} → {b.dropoffLoc}</p>
                                                <p className="text-slate-400 text-xs">{formatDateTime(b.trip?.tripDate)}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-emerald-400 font-bold text-sm">₹{b.fare?.toFixed(0)}</p>
                                                {b.trip?.vehicle?.type && vehicleBadge(b.trip.vehicle.type)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Vehicle Type Info */}
                        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400"/> Available Vehicle Types
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {VEHICLE_TYPES.slice(1).map(v => (
                                    <button key={v.key}
                                        onClick={() => { setVehicleFilter(v.key); setActiveTab('search'); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${v.color} hover:scale-105 transition-transform cursor-pointer`}>
                                        <span className="text-3xl">{v.emoji}</span>
                                        <span className="font-bold text-sm">{v.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════
                    TAB: SEARCH
                ════════════════════════════════════════════════ */}
                {activeTab === 'search' && (
                    <div className="animate-fade-in">
                        <div className="glass-panel p-8 rounded-2xl text-center mb-8 border border-slate-800">
                            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Where to next?
                            </h2>
                            <p className="text-slate-500 text-sm mb-6">Search for available rides on your route</p>
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                                <input type="text" placeholder="📍 Pickup Location"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder:text-slate-500"
                                    value={pickup} onChange={e => setPickup(e.target.value)} required/>
                                <input type="text" placeholder="🏁 Drop Location"
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder:text-slate-500"
                                    value={dropoff} onChange={e => setDropoff(e.target.value)} required/>
                                <button type="submit" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 justify-center">
                                    <Search className="w-4 h-4"/> Search
                                </button>
                            </form>
                        </div>

                        {searched && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Vehicle Type Filter */}
                                <div className="flex gap-2 flex-wrap">
                                    {VEHICLE_TYPES.map(v => (
                                        <button key={v.key}
                                            onClick={() => setVehicleFilter(v.key)}
                                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-semibold text-sm transition-all ${
                                                vehicleFilter === v.key
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                                            {v.emoji} {v.label}
                                            {v.key !== 'ALL' && (
                                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full ml-1">
                                                    {results.filter(r => (r.vehicle?.type || '').toUpperCase() === v.key).length}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <h3 className="text-slate-300 font-semibold">
                                    {filteredResults.length} {filteredResults.length === 1 ? 'Trip' : 'Trips'} Found
                                </h3>

                                {filteredResults.length === 0 ? (
                                    <div className="text-center text-slate-500 py-10 glass-card rounded-xl border border-slate-800">
                                        <Car className="w-12 h-12 mx-auto mb-3 text-slate-700"/>
                                        <p>No {vehicleFilter !== 'ALL' ? vehicleFilter : ''} trips found for this route.</p>
                                    </div>
                                ) : (
                                    filteredResults.map(t => (
                                        <div key={t.id} className="glass-card p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-slate-800 hover:border-blue-600/30 transition-all group">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-slate-700">
                                                    {VEHICLE_TYPES.find(v => v.key === (t.vehicle?.type || '').toUpperCase())?.emoji || '🚗'}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-lg font-bold text-white truncate">{t.source} → {t.destination}</h3>
                                                    <p className="text-slate-400 text-xs mt-0.5">
                                                        <Calendar className="w-3 h-3 inline mr-1"/>
                                                        {new Date(t.tripDate).toLocaleDateString()} {new Date(t.tripDate).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                        {vehicleBadge(t.vehicle?.type)}
                                                        <span className="text-[10px] text-slate-400 font-medium">#{t.vehicle?.vehicleNumber}</span>
                                                        <span className="text-[10px] text-slate-400">Driver: {t.driver?.username || 'NeuroDriver'}</span>
                                                    </div>
                                                    {/* Seat Availability Bar */}
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex gap-1">
                                                            {Array.from({ length: t.availableSeats || 4 }, (_, i) => (
                                                                <div key={i} className="w-3 h-3 rounded-sm bg-emerald-500/70 border border-emerald-500"/>
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">{t.availableSeats} seats left</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Per Trip</p>
                                                    <p className="text-2xl font-black text-emerald-400">₹{t.fare}</p>
                                                </div>
                                                <button
                                                    onClick={() => confirmBooking(t)}
                                                    disabled={bookingLoading === t.id}
                                                    className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-white/10 text-sm active:scale-95 disabled:opacity-60 flex items-center gap-1.5">
                                                    {bookingLoading === t.id
                                                        ? <><div className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"/>Booking...</>
                                                        : 'Book Now'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════
                    TAB: BOOKINGS
                ════════════════════════════════════════════════ */}
                {activeTab === 'bookings' && (
                    <div className="space-y-8 animate-fade-in">

                        {bookings.length === 0 ? (
                            <div className="text-center py-20 glass-card rounded-2xl border border-slate-800 border-dashed">
                                <Ticket className="w-14 h-14 mx-auto mb-4 text-slate-700"/>
                                <h3 className="text-slate-400 font-semibold text-lg">No Bookings Yet</h3>
                                <p className="text-slate-600 text-sm mt-1">Start by searching for a ride!</p>
                                <button onClick={() => setActiveTab('search')}
                                    className="mt-5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors">
                                    Search Rides
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* ── Section: Ongoing / Upcoming ── */}
                                {ongoingBookings.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"/>
                                                <h2 className="text-lg font-bold text-white">Ongoing / Upcoming</h2>
                                            </div>
                                            <span className="bg-emerald-900/50 border border-emerald-700/50 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                {ongoingBookings.length}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {ongoingBookings.map(b => <BookingCard key={b.id} b={b}/>)}
                                        </div>
                                    </section>
                                )}

                                {/* ── Section: Completed ── */}
                                {completedBookings.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-blue-400"/> Completed Trips
                                            </h2>
                                            <span className="bg-blue-900/50 border border-blue-700/50 text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                {completedBookings.length}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {completedBookings.map(b => <BookingCard key={b.id} b={b}/>)}
                                        </div>
                                    </section>
                                )}

                                {/* ── Section: Cancelled ── */}
                                {cancelledBookings.length > 0 && (
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h2 className="text-lg font-bold text-slate-400 flex items-center gap-2">
                                                <X className="w-5 h-5"/> Cancelled
                                            </h2>
                                            <span className="bg-slate-800 border border-slate-700 text-slate-500 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                                {cancelledBookings.length}
                                            </span>
                                        </div>
                                        <div className="space-y-3 opacity-60">
                                            {cancelledBookings.map(b => <BookingCard key={b.id} b={b}/>)}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ═══ TRACKING MODAL ═══ */}
            {isTrackingModalOpen && trackingBooking && (
                <div className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-20 animate-fade-in overflow-y-auto">
                    <div className="bg-slate-900 w-full max-w-6xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in mb-20">
                        <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Gauge className="w-5 h-5 text-purple-500"/> Vehicle Tracking
                                </h2>
                                <p className="text-xs text-slate-400">Booking #{trackingBooking.id} • {trackingBooking.pickupLoc} ➔ {trackingBooking.dropoffLoc}</p>
                            </div>
                            <button onClick={() => setIsTrackingModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingTracking ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"/>
                                    <p className="text-slate-400">Loading tracking information...</p>
                                </div>
                            ) : trackingError ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <AlertCircle className="w-16 h-16 text-amber-500 mb-4"/>
                                    <h3 className="text-xl font-bold text-white mb-2">Tracking Unavailable</h3>
                                    <p className="text-slate-400 text-center max-w-md">{trackingError.message}</p>
                                    {trackingError.availableFrom && (
                                        <div className="mt-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Clock className="w-4 h-4 text-blue-400"/>
                                                <span>Available from: <strong>{formatDateTime(trackingError.availableFrom)}</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : trackingData ? (
                                <>
                                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                                                    {trackingData.driver?.name?.charAt(0) || 'D'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{trackingData.driver?.name || 'Driver'}</h3>
                                                    <p className="text-sm text-slate-400">{trackingData.vehicle?.model || 'Vehicle'} • {trackingData.vehicle?.licensePlate || 'N/A'}</p>
                                                    <p className="text-xs text-slate-500 mt-1">Status: <span className={`font-bold ${trackingData.trip?.status === 'IN_PROGRESS' ? 'text-emerald-400' : 'text-blue-400'}`}>{trackingData.trip?.status}</span></p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <a href={`tel:${trackingData.driver?.phone || ''}`}
                                                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors">
                                                    <Phone className="w-5 h-5"/>
                                                </a>
                                                <button onClick={() => alert('Chat feature coming soon!')}
                                                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors">
                                                    <MessageSquare className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <VehicleTracker
                                        vehicleId={trackingData.vehicle?.id}
                                        tripId={trackingData.trip?.id}
                                        vehicleName={`${trackingData.vehicle?.model || 'Vehicle'} - ${trackingData.vehicle?.licensePlate || ''}`}
                                        routePolyline={trackingData.trip?.selectedRoutePolyline ? decodePolyline(trackingData.trip.selectedRoutePolyline) : []}
                                        source={{ lat: trackingData.trip?.sourceLatitude, lng: trackingData.trip?.sourceLongitude, name: trackingData.trip?.source }}
                                        destination={{ lat: trackingData.trip?.destinationLatitude, lng: trackingData.trip?.destinationLongitude, name: trackingData.trip?.destination }}
                                        height={500} showProgress={true}
                                        onComplete={() => { alert('Trip completed!'); setIsTrackingModalOpen(false); }}
                                    />
                                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Seats', value: trackingData.booking?.seats || 'N/A' },
                                            { label: 'Pickup',  value: trackingData.booking?.pickupLocation || trackingData.trip?.source },
                                            { label: 'Dropoff', value: trackingData.booking?.dropoffLocation || trackingData.trip?.destination },
                                            { label: 'Trip Date', value: formatDateTime(trackingData.trip?.tripDate) },
                                        ].map(info => (
                                            <div key={info.label} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{info.label}</p>
                                                <p className="text-sm font-semibold text-white truncate">{info.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ REVIEW MODAL ═══ */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                        <h2 className="text-xl font-bold text-white mb-2">Rate Your Trip</h2>
                        <p className="text-sm text-slate-400 mb-6">How was your experience with the driver?</p>
                        <div className="flex justify-center gap-2 mb-6">
                            {[1,2,3,4,5].map(star => (
                                <button key={star} onClick={() => setRating(star)}
                                    className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
                            ))}
                        </div>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 focus:border-blue-500 outline-none mb-6 h-32 resize-none"
                            placeholder="Share your feedback about the driver..."
                            value={feedback} onChange={e => setFeedback(e.target.value)}/>
                        <button onClick={submitReview} disabled={rating === 0}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${rating > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg active:scale-[0.98]' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}>
                            Submit Review
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
