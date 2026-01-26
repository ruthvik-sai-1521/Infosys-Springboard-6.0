import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';

const CustomerDashboard = () => {
    const { user } = useAuth();
    const customerId = user?.id || 2; // Stub logic
    const [activeTab, setActiveTab] = useState('search');
    
    const [pickup, setPickup] = useState('');
    const [dropoff, setDropoff] = useState('');
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [bookings, setBookings] = useState([]);

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
            // Aggregate all seatNumbers from bookings
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
        setOccupiedSeats([]); // Reset
        fetchOccupiedSeats(trip.id);
    };

    const toggleSeat = (seatNum) => {
        const s = String(seatNum);
        if (occupiedSeats.includes(s)) return;
        
        if (selectedSeats.includes(s)) {
            setSelectedSeats(selectedSeats.filter(item => item !== s));
        } else {
            // Limit max seats? e.g. 4
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
                seatNumbers: selectedSeats // Send array
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            
            alert("Booking Confirmed! Seats: " + selectedSeats.join(', '));
            setSearched(false); 
            setSelectedTrip(null);
            
            // Refresh bookings
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
            
            <div className="max-w-4xl mx-auto pt-24 px-6">
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
                                        {/* Live Tracking Button - Logic: -1hr to +1hr of trip time OR status IN_PROGRESS */}
                                        {(b.status === 'CONFIRMED' || b.trip?.status === 'IN_PROGRESS') && (
                                            <button 
                                                onClick={() => {
                                                    alert("Live tracking feature is simulated. Driver location: Bangalore."); 
                                                    // In a real app, open a modal with GoogleMap centered on b.trip.vehicle.currentLocation
                                                }}
                                                className="mt-3 text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 w-fit"
                                            >
                                                📍 Track Ride
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
                            placeholder="Share your feedback provided to the driver..."
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
