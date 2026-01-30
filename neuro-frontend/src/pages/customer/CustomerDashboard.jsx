import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { Phone, MessageSquare, X, MapPin, Clock, AlertCircle, Gauge } from 'lucide-react';
import { VehicleTracker } from '../../components/maps';

const CustomerDashboard = () => {
    const { user } = useAuth();
    const customerId = user?.id || 2;
    const [activeTab, setActiveTab] = useState('search');
    
    const [pickup, setPickup] = useState('');
    const [dropoff, setDropoff] = useState('');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [bookings, setBookings] = useState([]);

    // NEW: Tracking State
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingBooking, setTrackingBooking] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [trackingError, setTrackingError] = useState(null);
    const [loadingTracking, setLoadingTracking] = useState(false);

    useEffect(() => {
        if (!customerId) return;
        axios.get(`/api/bookings/customer/${customerId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
            .then(res => setBookings(res.data))
            .catch(err => console.error(err));
    }, [customerId]);

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.get(`/api/trips/search?source=${pickup}&destination=${dropoff}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setResults(res.data);
            setSearched(true);
        } catch (err) {
            console.error(err);
        }
    };

    const [selectedTrip, setSelectedTrip] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [occupiedSeats, setOccupiedSeats] = useState([]);

    const fetchOccupiedSeats = async (tripId) => {
        try {
            const res = await axios.get(`/api/bookings/trip/${tripId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            const taken = res.data.reduce((acc, booking) => {
                if (booking.seatNumbers) {
                    return [...acc, ...booking.seatNumbers.split(',')];
                }
                return acc;
            }, []);
            setOccupiedSeats(taken);
        } catch (err) {
            console.error("Failed to fetch seat availability", err);
        }
    };

    const openSeatSelection = (trip) => {
        setSelectedTrip(trip);
        setSelectedSeats([]);
        setOccupiedSeats([]);
        fetchOccupiedSeats(trip.id);
    };

    const toggleSeat = (seatNum) => {
        const s = String(seatNum);
        if (occupiedSeats.includes(s)) return;
        
        if (selectedSeats.includes(s)) {
            setSelectedSeats(selectedSeats.filter(item => item !== s));
        } else {
            if (selectedSeats.length >= 4) return alert("You can only book up to 4 seats.");
            setSelectedSeats([...selectedSeats, s]);
        }
    };

    const confirmBooking = async () => {
        if (!selectedTrip || selectedSeats.length === 0) return;
        
        try {
            await axios.post('/api/bookings/book', {
                tripId: selectedTrip.id,
                customerId: customerId,
                seatNumbers: selectedSeats
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            
            alert("Booking Confirmed! Seats: " + selectedSeats.join(', '));
            setSearched(false); 
            setSelectedTrip(null);
            
            const res = await axios.get(`/api/bookings/customer/${customerId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setBookings(res.data);
            setActiveTab('bookings');
        } catch (error) {
            alert("Booking Failed: " + (error.response?.data?.error || error.message));
        }
    };

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewBooking, setReviewBooking] = useState(null);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");

    const openReview = (booking) => {
        setReviewBooking(booking);
        setRating(0);
        setFeedback("");
        setReviewModalOpen(true);
    };

    const submitReview = async () => {
        if (!reviewBooking || rating === 0) return;
        try {
            await axios.post('/api/reviews/submit', {
                tripId: reviewBooking.trip.id,
                customerId: customerId,
                rating: rating,
                feedback: feedback
            });
            alert("Review Submitted! Thank you.");
            setReviewModalOpen(false);
        } catch (error) {
            alert("Failed to submit review: " + (error.response?.data?.error || error.message));
        }
    };

    // NEW: Handle tracking
    const handleTrackVehicle = async (booking) => {
        setTrackingBooking(booking);
        setIsTrackingModalOpen(true);
        setLoadingTracking(true);
        setTrackingData(null);
        setTrackingError(null);

        try {
            const res = await axios.get(`/api/bookings/${booking.id}/track?customerId=${customerId}`);
            const data = res.data;

            if (!data.trackingAvailable) {
                setTrackingError({
                    reason: data.reason,
                    message: data.message,
                    availableFrom: data.availableFrom,
                    endedAt: data.endedAt
                });
            } else {
                setTrackingData(data);
            }
        } catch (err) {
            setTrackingError({
                reason: 'error',
                message: err.response?.data?.error || 'Failed to load tracking information'
            });
        }
        setLoadingTracking(false);
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
        return new Date(dateTime).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to decode polyline
    const decodePolyline = (encoded) => {
        if (!encoded) return [];
        const poly = [];
        let index = 0, len = encoded.length;
        let lat = 0, lng = 0;

        while (index < len) {
            let b, shift = 0, result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            const p = [lat * 1e-5, lng * 1e-5];
            poly.push(p);
        }
        return poly;
    };

    // Helper to check if tracking should be shown (for button display)
    const canTrack = (booking) => {
        if (!booking.trip) return false;
        const tripDate = new Date(booking.trip.tripDate);
        const now = new Date();
        const oneHourBefore = new Date(tripDate.getTime() - 60 * 60 * 1000);
        
        // Show button if within reasonable range or trip is in progress
        return booking.status === 'CONFIRMED' || booking.trip.status === 'IN_PROGRESS';
    };

    const renderSeat = (num) => {
        const s = String(num);
        const isOccupied = occupiedSeats.includes(s);
        const isSelected = selectedSeats.includes(s);

        return (
            <button 
                key={num}
                onClick={() => toggleSeat(num)}
                disabled={isOccupied}
                className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-sm transition-all
                    ${isOccupied ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed' : 
                      isSelected ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105' : 
                      'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500'
                    }`}
            >
                {num}
            </button>
        );
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            
            <div className="max-w-4xl mx-auto pt-24 px-6 pb-20">
                {/* Tabs */}
                <div className="flex space-x-4 mb-8 justify-center">
                    <button onClick={() => setActiveTab('search')} className={`px-6 py-2 rounded-full ${activeTab === 'search' ? 'bg-blue-600' : 'bg-slate-800'}`}>Search Rides</button>
                    <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2 rounded-full ${activeTab === 'bookings' ? 'bg-blue-600' : 'bg-slate-800'}`}>My Bookings</button>
                </div>

                {activeTab === 'search' && (
                <>
                    <div className="glass-panel p-8 rounded-2xl text-center mb-10">
                        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Where to next?
                        </h1>
                        
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text" 
                                placeholder="Pickup Location" 
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={pickup} onChange={e => setPickup(e.target.value)} required
                            />
                            <input 
                                type="text" 
                                placeholder="Drop Location" 
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={dropoff} onChange={e => setDropoff(e.target.value)} required
                            />
                            <button type="submit" className="btn-primary px-8 py-4 rounded-lg font-bold text-lg shadow-lg">
                                Search Rides
                            </button>
                        </form>
                    </div>

                    {searched && (
                        <div className="space-y-4 animate-fade-in">
                            <h2 className="text-xl font-semibold text-slate-300 mb-4">Available Trips</h2>
                            {results.length === 0 ? (
                                <div className="text-center text-slate-500 py-10 glass-card rounded-xl">
                                    No trips found for this route.
                                </div>
                            ) : (
                                results.map(t => (
                                    <div key={t.id} className="glass-card p-6 rounded-xl flex flex-col md:flex-row justify-between items-center group hover:bg-slate-800/80 transition">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center text-3xl">
                                                🚗
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{t.source} to {t.destination}</h3>
                                                <p className="text-slate-400 text-sm">
                                                    {new Date(t.tripDate).toLocaleDateString()} {new Date(t.tripDate).toLocaleTimeString()}
                                                </p>
                                                <div className="mt-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700">
                                                    <p className="font-semibold text-blue-400">Vehicle: {t.vehicle?.vehicleNumber}</p>
                                                    <p className="text-xs text-slate-400">Model: {t.vehicle?.type} • Seats Left: {t.availableSeats}</p>
                                                </div>
                                                <p className="text-xs text-slate-500 opacity-80 mt-1">
                                                    Driver: {t.driver?.username || 'NeuroDriver'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="text-right mt-4 md:mt-0 flex items-center gap-6">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest">Per Seat</p>
                                                <p className="text-2xl font-bold text-emerald-400">₹{t.fare}</p>
                                            </div>
                                            <button 
                                                onClick={() => openSeatSelection(t)}
                                                className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-blue-50 transition shadow-lg shadow-white/10">
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
                )}
                
                {activeTab === 'bookings' && (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-semibold text-slate-300 mb-4">Your Bookings</h2>
                         {bookings.length === 0 ? (
                            <div className="text-center text-slate-500 py-10 glass-card rounded-xl">
                                No bookings yet.
                            </div>
                        ) : (
                            bookings.map(b => (
                                <div key={b.id} className="glass-card p-6 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {b.pickupLoc} <span className="text-slate-500">➔</span> {b.dropoffLoc}
                                        </h3>
                                        <p className="text-slate-400 text-sm">
                                            Booking ID: #{b.id} • Status: <span className="text-emerald-400">{b.status}</span>
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                            <span>Date: {new Date(b.bookingTime).toLocaleDateString()}</span>
                                            {b.seatNumbers && <span className="text-blue-400 font-bold">Seats: {b.seatNumbers}</span>}
                                        </div>
                                        
                                        {/* NEW: Track Vehicle Button with time-based display */}
                                        {canTrack(b) && (
                                            <button 
                                                onClick={() => handleTrackVehicle(b)}
                                                className="mt-3 text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 w-fit transition-colors"
                                            >
                                                <MapPin className="w-3 h-3" /> Track Vehicle
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <p className="text-xl font-bold text-white">₹{b.fare}</p>
                                        <p className="text-xs text-slate-400">{b.seatsBooked} Seats</p>
                                        <button 
                                            onClick={() => openReview(b)}
                                            className="mt-2 text-xs font-bold bg-slate-800 hover:bg-yellow-500/20 text-slate-300 hover:text-yellow-400 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-all flex items-center gap-1"
                                        >
                                           ★ Rate Trip
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* SEAT SELECTION MODAL */}
            {selectedTrip && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button onClick={() => setSelectedTrip(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                        
                        <h2 className="text-xl font-bold text-white mb-1">Select Seats</h2>
                        <p className="text-sm text-slate-400 mb-6">{selectedTrip.source} ➔ {selectedTrip.destination}</p>

                        <div className="flex justify-center mb-8">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-inner inline-block">
                                <div className="text-center text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4 border-b border-slate-700 pb-2">Front</div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-700/50 border border-slate-600 flex items-center justify-center text-xs text-slate-500 cursor-not-allowed">
                                        Driver
                                    </div>
                                    {renderSeat(1)}
                                    {renderSeat(2)}
                                    {renderSeat(3)}
                                    {renderSeat(4)}
                                    {renderSeat(5)}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4">
                            <div className="text-sm text-slate-400">
                                Selected: <span className="text-white font-bold">{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</span>
                            </div>
                            <div className="text-xl font-bold text-emerald-400">
                                ₹{selectedSeats.length * selectedTrip.fare}
                            </div>
                        </div>

                        <button 
                            disabled={selectedSeats.length === 0}
                            onClick={confirmBooking}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${selectedSeats.length > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                        >
                            Confirm Booking
                        </button>
                    </div>
                </div>
            )}

            {/* NEW: TRACKING MODAL */}
            {isTrackingModalOpen && trackingBooking && (
                <div className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-20 animate-fade-in overflow-y-auto">
                    <div className="bg-slate-900 w-full max-w-6xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in mb-20">
                        {/* Header */}
                        <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Gauge className="w-5 h-5 text-purple-500" /> Vehicle Tracking
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Booking #{trackingBooking.id} • {trackingBooking.pickupLoc} ➔ {trackingBooking.dropoffLoc}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsTrackingModalOpen(false)} 
                                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5"/>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {loadingTracking ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-slate-400">Loading tracking information...</p>
                                </div>
                            ) : trackingError ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Tracking Unavailable</h3>
                                    <p className="text-slate-400 text-center max-w-md">
                                        {trackingError.message}
                                    </p>
                                    {trackingError.availableFrom && (
                                        <div className="mt-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Clock className="w-4 h-4 text-blue-400" />
                                                <span>Available from: <strong>{formatDateTime(trackingError.availableFrom)}</strong></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : trackingData ? (
                                <>
                                    {/* Driver Info Card */}
                                    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {/* Driver Avatar */}
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                                                    {trackingData.driver?.name?.charAt(0) || 'D'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">{trackingData.driver?.name || 'Driver'}</h3>
                                                    <p className="text-sm text-slate-400">
                                                        {trackingData.vehicle?.model || 'Vehicle'} • {trackingData.vehicle?.licensePlate || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Trip Status: <span className={`font-bold ${trackingData.trip?.status === 'IN_PROGRESS' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                            {trackingData.trip?.status}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <a
                                                    href={`tel:${trackingData.driver?.phone || ''}`}
                                                    className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors"
                                                    title="Call Driver"
                                                >
                                                    <Phone className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => alert('Chat feature coming soon!')}
                                                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors"
                                                    title="Message Driver"
                                                >
                                                    <MessageSquare className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Map with VehicleTracker */}
                                    <VehicleTracker
                                        vehicleId={trackingData.vehicle?.id}
                                        tripId={trackingData.trip?.id}
                                        vehicleName={`${trackingData.vehicle?.model || 'Vehicle'} - ${trackingData.vehicle?.licensePlate || ''}`}
                                        routePolyline={trackingData.trip?.selectedRoutePolyline ? decodePolyline(trackingData.trip.selectedRoutePolyline) : []}
                                        source={{
                                            lat: trackingData.trip?.sourceLatitude,
                                            lng: trackingData.trip?.sourceLongitude,
                                            name: trackingData.trip?.source
                                        }}
                                        destination={{
                                            lat: trackingData.trip?.destinationLatitude,
                                            lng: trackingData.trip?.destinationLongitude,
                                            name: trackingData.trip?.destination
                                        }}
                                        height={500}
                                        showProgress={true}
                                        onComplete={() => {
                                            alert('Trip completed!');
                                            setIsTrackingModalOpen(false);
                                        }}
                                    />

                                    {/* Trip Info */}
                                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Seats</p>
                                            <p className="text-lg font-bold text-white">{trackingData.booking?.seats || 'N/A'}</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pickup</p>
                                            <p className="text-sm font-semibold text-white truncate">{trackingData.booking?.pickupLocation || trackingData.trip?.source}</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Dropoff</p>
                                            <p className="text-sm font-semibold text-white truncate">{trackingData.booking?.dropoffLocation || trackingData.trip?.destination}</p>
                                        </div>
                                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Trip Date</p>
                                            <p className="text-sm font-semibold text-white">{formatDateTime(trackingData.trip?.tripDate)}</p>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* REVIEW MODAL */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button onClick={() => setReviewModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                        
                        <h2 className="text-xl font-bold text-white mb-2">Rate Your Trip</h2>
                        <p className="text-sm text-slate-400 mb-6">How was your experience with the driver?</p>

                        <div className="flex justify-center gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star} 
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-slate-700'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>

                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 focus:border-blue-500 outline-none mb-6 h-32 resize-none"
                            placeholder="Share your feedback about the driver..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />

                        <button 
                            onClick={submitReview}
                            disabled={rating === 0}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${rating > 0 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                        >
                            Submit Review
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
