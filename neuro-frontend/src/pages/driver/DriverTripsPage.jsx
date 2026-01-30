import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { Calendar, Clock, MapPin, ArrowLeft, PlusCircle, Users, Phone, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // Bangalore

const DriverTripsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [vehicles, setVehicles] = useState([]);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    
    // Booking View State
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [occupiedSeats, setOccupiedSeats] = useState([]);

    // Map & Route State
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [mapTrip, setMapTrip] = useState(null);
    const [directionsResponse, setDirectionsResponse] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    });

    // ... (Existing State: tripForm, etc.)
    const [tripForm, setTripForm] = useState({
        source: '', destination: '', date: '', time: '', availableSeats: 3, fare: 0, vehicleId: '', estimatedDuration: ''
    });

    const driverId = user?.id || 1;

    // ... (Existing callback: fetchTrips, fetchVehicles)
    const fetchTrips = useCallback(async () => {
        try {
            const res = await axios.get(`/api/trips/driver/${driverId}`);
            setTrips(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [driverId]);

    const fetchVehicles = useCallback(async () => {
        try {
            const res = await axios.get(`/api/driver/${driverId}/vehicles`);
            setVehicles(res.data);
            if(res.data.length > 0) setTripForm(prev => ({...prev, vehicleId: res.data[0].id}));
        } catch (err) { console.error(err); }
    }, [driverId]);

    useEffect(() => {
        fetchTrips();
        fetchVehicles();
    }, [fetchTrips, fetchVehicles, activeTab]);

    // ... (Existing: fetchBookingsForTrip, renderDriverSeatView, Fare Calc)
    const fetchBookingsForTrip = async (trip) => {
        setSelectedTrip(trip);
        setLoadingBookings(true);
        try {
            const res = await axios.get(`/api/bookings/trip/${trip.id}`);
            setBookings(res.data);
            
            // Calculate occupied seats
            const taken = res.data.reduce((acc, booking) => {
                if (booking.seatNumbers) {
                    return [...acc, ...booking.seatNumbers.split(',')];
                }
                return acc;
            }, []);
            setOccupiedSeats(taken);
            
        } catch (err) {
            console.error(err);
            alert("Failed to fetch bookings.");
        }
        setLoadingBookings(false);
    };

    const renderDriverSeatView = (seatNum) => {
        const s = String(seatNum);
        const isOccupied = occupiedSeats.includes(s);
        // Find booking for this seat to show name on hover maybe?
        const booking = bookings.find(b => b.seatNumbers && b.seatNumbers.split(',').includes(s));

        return (
            <div 
                className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-sm transition-all relative group
                    ${isOccupied ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'}`}
            >
                {seatNum}
                {isOccupied && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {booking?.customer?.username || 'Occupied'}
                    </div>
                )}
            </div>
        );
    };


    // Automatic Fare Calculation
    useEffect(() => {
        if (tripForm.vehicleId && tripForm.totalKm) {
            const selectedVehicle = vehicles.find(v => String(v.id) === String(tripForm.vehicleId));
            if (selectedVehicle) {
                let rate = 0;
                switch (selectedVehicle.type?.toUpperCase()) {
                    case 'HATCHBACK': rate = 1.5; break;
                    case 'SEDAN': rate = 2.0; break;
                    case 'SUV': rate = 2.5; break;
                    default: rate = 2.0; // Default or fallback
                }
                const calculatedFare = (parseFloat(tripForm.totalKm) * rate).toFixed(2);
                setTripForm(prev => {
                    if (prev.fare !== calculatedFare) {
                        return { ...prev, fare: calculatedFare };
                    }
                    return prev;
                });
            }
        }
    }, [tripForm.vehicleId, tripForm.totalKm, vehicles]);

    const handlePostTrip = async (e) => {
        e.preventDefault();
        try {
            // Get the selected vehicle to retrieve its seat count
            const selectedVehicle = vehicles.find(v => String(v.id) === String(tripForm.vehicleId));
            const availableSeats = selectedVehicle?.seatCount || 3; // Default to 3 if not found
            
            const tripPayload = {
                driverId: user?.id || 1, // Ensure driverId is valid
                vehicleId: tripForm.vehicleId,
                source: tripForm.source,
                destination: tripForm.destination,
                tripDate: `${tripForm.date}T${tripForm.time}:00`,
                fare: parseFloat(tripForm.fare),
                availableSeats: availableSeats, // Use vehicle's actual seat count
                pickupPoints: tripForm.pickupPoints,
                dropPoints: tripForm.dropPoints,
                totalKm: tripForm.totalKm,
                estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : null
            };
            await axios.post(`/api/trips/create`, tripPayload);
            alert("Trip Posted Successfully!");
            setIsPostModalOpen(false);
            fetchTrips();
        } catch (error) {
            alert("Submission Failed: " + (error.response?.data?.error || error.message));
        }
    };

    // AI Route Suggestion
    const handleGetAIRoute = async () => {
        if (!tripForm.source || !tripForm.destination) {
            alert("Please enter source and destination first.");
            return;
        }
        try {
            const res = await axios.get(`/api/routes/suggest?source=${tripForm.source}&destination=${tripForm.destination}`);
            if (res.data) {
                const route = res.data;
                const distanceMeters = route.distanceMeters || 0;
                const duration = route.duration || "0s";
                const km = (distanceMeters / 1000).toFixed(1);
                
                // Parse duration from seconds to minutes
                const durationInSeconds = parseInt(duration.replace('s', ''));
                const durationInMinutes = Math.ceil(durationInSeconds / 60);
                
                alert(`AI Suggested Route:\nDistance: ${km} km\nDuration: ${durationInMinutes} minutes`);
                
                // Auto-fill form
                setTripForm(prev => ({
                    ...prev,
                    totalKm: km,
                    estimatedReachingTime: `${durationInMinutes} minutes`,
                    estimatedDuration: durationInMinutes
                }));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to get AI route suggestion.");
        }
    };

    const handleStartTrip = async (trip) => {
        try {
            await axios.post(`/api/trips/${trip.id}/start`);
            // Start Simulation
            await axios.post(`/api/simulation/start/${trip.vehicle.id}`);
            alert("Trip Started! Live tracking is active.");
            fetchTrips();
        } catch (err) {
            console.error(err);
            alert("Failed to start trip.");
        }
    };

    const handleEndTrip = async (trip) => {
        try {
            await axios.post(`/api/trips/${trip.id}/end`);
            // Stop Simulation
            await axios.post(`/api/simulation/stop/${trip.vehicle.id}`);
            alert("Trip Ended.");
            fetchTrips();
        } catch (err) {
            console.error(err);
            alert("Failed to end trip.");
        }
    };

    // Calculate Directions for Map
    const calculateRoute = async (trip) => {
        if (!isLoaded || !window.google) return;
        
        const directionsService = new window.google.maps.DirectionsService();
        
        // Parse waypoints from pickup and drop strings
        const waypoints = [];
        if (trip.pickupPoints) {
            trip.pickupPoints.split(',').forEach(p => waypoints.push({ location: p.trim(), stopover: true }));
        }
        if (trip.dropPoints) {
            trip.dropPoints.split(',').forEach(p => waypoints.push({ location: p.trim(), stopover: true }));
        }
        
        try {
            const results = await directionsService.route({
                origin: trip.source,
                destination: trip.destination,
                waypoints: waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
            });
            setDirectionsResponse(results);
        } catch (err) {
            console.error("Directions Request failed:", err);
            alert("Could not load route on map.");
        }
    };

    const handleViewRoute = (trip) => {
        setMapTrip(trip);
        setIsMapModalOpen(true);
        // Delay slightly to ensure modal is mounted or simple call
        setTimeout(() => calculateRoute(trip), 500);
    };

    // Filter Logic
    const upcomingTrips = trips.filter(t => new Date(t.tripDate) > new Date() && t.status !== 'COMPLETED'); 
    const completedTrips = trips.filter(t => t.status === 'COMPLETED' || new Date(t.tripDate) <= new Date());

    const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : completedTrips;

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            <Navbar />
            
             {/* Content Wrapper */}
             <div className="pt-24 max-w-7xl mx-auto px-6 animate-fade-in">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <button 
                            onClick={() => navigate('/driver')}
                            className="flex items-center text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">Trip Management</h1>
                        
                        {/* Tabs */}
                        <div className="flex gap-6 border-b border-slate-800 mt-4">
                            <button 
                                className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 ${activeTab === 'upcoming' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-white'}`}
                                onClick={() => setActiveTab('upcoming')}
                            >
                                Upcoming Trips
                            </button>
                            <button 
                                className={`pb-2 px-1 text-sm font-bold transition-colors border-b-2 ${activeTab === 'completed' ? 'text-blue-400 border-blue-400' : 'text-slate-400 border-transparent hover:text-white'}`}
                                onClick={() => setActiveTab('completed')}
                            >
                                Past History
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => setIsPostModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transform transition-all active:scale-[0.98]"
                    >
                        <PlusCircle className="w-5 h-5" /> Post New Trip
                    </button>
                </div>

                {/* TRIP GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedTrips.length === 0 ? (
                        <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                            <h3 className="text-slate-500 font-medium">No {activeTab} trips found.</h3>
                            {activeTab === 'upcoming' && <p className="text-slate-600 text-sm mt-1">Post a new trip to get started!</p>}
                        </div>
                    ) : (
                        displayedTrips.map(trip => (
                            <div key={trip.id} className="glass-card bg-slate-900/60 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="text-white font-bold text-lg flex items-center gap-2">
                                        {trip.source} <span className="text-slate-500 text-sm">➔</span> {trip.destination}
                                    </div>
                                    <div className="bg-slate-950/80 px-3 py-1 rounded-lg text-sm font-mono text-emerald-400 border border-slate-800">
                                        ₹{trip.fare}
                                    </div>
                                </div>
                                
                                <div className="space-y-3 text-sm text-slate-300 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-slate-500" />
                                        {new Date(trip.tripDate).toLocaleDateString(undefined, {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'})}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-slate-500" />
                                        {new Date(trip.tripDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${trip.status === 'IN_PROGRESS' ? 'bg-emerald-500 animate-pulse' : trip.status === 'AUTO_COMPLETED' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
                                        <span className="uppercase text-[10px] font-bold tracking-widest">{trip.status}</span>
                                        {trip.status === 'AUTO_COMPLETED' && <span className="text-[10px] text-amber-400">(Auto-ended)</span>}
                                    </div>
                                    {trip.actualStartTime && (
                                        <div className="flex items-center gap-3 text-xs text-blue-400">
                                            <Clock className="w-3 h-3" />
                                            Started: {new Date(trip.actualStartTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    )}
                                    {trip.actualEndTime && (
                                        <div className="flex items-center gap-3 text-xs text-emerald-400">
                                            <Clock className="w-3 h-3" />
                                            Ended: {new Date(trip.actualEndTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center relative z-10 gap-2">
                                    <div className="text-center">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Seats</p>
                                        <p className="text-xl font-bold text-white leading-none mt-1">{trip.availableSeats}</p>
                                    </div>
                                    
                                    <div className="flex-1 flex justify-end gap-2 flex-wrap">
                                        {trip.status === 'SCHEDULED' && (
                                            <button onClick={() => handleStartTrip(trip)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors">
                                                Start Trip
                                            </button>
                                        )}
                                        {trip.status === 'IN_PROGRESS' && (
                                            <>
                                                <button onClick={() => handleViewRoute(trip)} className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> Map
                                                </button>
                                                <button onClick={() => handleEndTrip(trip)} className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg transition-colors">
                                                    End Trip
                                                </button>
                                            </>
                                        )}

                                        <button 
                                            onClick={() => fetchBookingsForTrip(trip)}
                                            className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                        >
                                            <Users className="w-3 h-3" /> Bookings
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* MODAL FOR MAP ROUTE */}
                {isMapModalOpen && isLoaded && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                         <div className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-blue-500" /> Trip Route
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {mapTrip?.source} ➔ {mapTrip?.destination}
                                    </p>
                                </div>
                                <button onClick={() => setIsMapModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="flex-1 relative bg-slate-800">
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={defaultCenter}
                                    zoom={12}
                                    options={{
                                        styles: [
                                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
                                        ]
                                    }}
                                >
                                    {directionsResponse && (
                                    <DirectionsRenderer directions={directionsResponse} />
                                    )}
                                </GoogleMap>
                            </div>
                         </div>
                    </div>
                )}

                {/* MODAL FOR VIEW BOOKINGS */}
                {selectedTrip && (
                    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-28 animate-fade-in">
                        <div className="bg-slate-900 w-full max-w-5xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in max-h-[85vh] flex flex-col">
                            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Trip Bookings</h2>
                                    <p className="text-xs text-slate-400">{selectedTrip.source} to {selectedTrip.destination}</p>
                                </div>
                                <button onClick={() => setSelectedTrip(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 h-[60vh]">
                                {/* LEFT: Booking List */}
                                <div className="md:col-span-2 border-r border-slate-800 overflow-y-auto">
                                    {loadingBookings ? (
                                        <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            Loading passengers...
                                        </div>
                                    ) : bookings.length === 0 ? (
                                        <div className="p-10 text-center text-slate-500">
                                            No bookings received yet.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-800">
                                            {bookings.map(booking => (
                                                <div key={booking.id} className="p-4 flex justify-between items-center hover:bg-slate-800/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                                            {booking.customer?.username?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{booking.customer?.username || (booking.passengerName || 'Unknown User')}</h4>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <span>{booking.seatsBooked} Seat(s)</span>
                                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                                <span className="text-emerald-400">{booking.status}</span>
                                                            </div>
                                                            {booking.seatNumbers && <div className="text-xs text-blue-400 mt-1 font-mono">Seats: {booking.seatNumbers}</div>}
                                                        </div>
                                                    </div>
                                                    <a href={`tel:${booking.customer?.mobileNumber || booking.phone || ''}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all">
                                                        <Phone className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT: Car Visual */}
                                <div className="bg-slate-950 p-6 flex flex-col items-center justify-center">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Seat Map</h3>
                                    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-inner">
                                        <div className="text-center text-[10px] text-slate-600 uppercase font-bold tracking-widest mb-4 border-b border-slate-800 pb-2">Front</div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-600">
                                                Driver
                                            </div>
                                            {renderDriverSeatView(1)}
                                            {renderDriverSeatView(2)}
                                            {renderDriverSeatView(3)}
                                            {renderDriverSeatView(4)}
                                            {renderDriverSeatView(5)}
                                        </div>
                                        <div className="mt-8 flex gap-4 justify-center text-[10px] text-slate-500">
                                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500"></span> Booked</div>
                                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-800 border-slate-700"></span> Empty</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isPostModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
                        <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-500" /> Post a New Trip
                                </h2>
                                <button onClick={() => setIsPostModalOpen(false)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center">✕</button>
                            </div>
                            <form onSubmit={handlePostTrip} className="p-6 space-y-5">
                                <div className="flex justify-end">
                                    <button type="button" onClick={handleGetAIRoute} className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded font-bold transition-colors">
                                        🤖 Suggest AI Route
                                    </button>
                                </div>
                                {/* Row 1: Route & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" required placeholder="Source"
                                            value={tripForm.source}
                                            onChange={e => setTripForm({...tripForm, source: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" required placeholder="Destination"
                                            value={tripForm.destination}
                                            onChange={e => setTripForm({...tripForm, destination: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                                        <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" required
                                            onChange={e => setTripForm({...tripForm, date: e.target.value})} />
                                    </div>
                                </div>

                                {/* Row 2: Time, Fare, Vehicle */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time</label>
                                        <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" required
                                            onChange={e => setTripForm({...tripForm, time: e.target.value})} />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vehicle</label>
                                        <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" required
                                            onChange={e => setTripForm({...tripForm, vehicleId: e.target.value})}>
                                            <option value="">-- Select --</option>
                                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.type})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Reaching Time</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" placeholder="e.g. 5 Hours or 8:30 PM"
                                            value={tripForm.estimatedReachingTime || ''}
                                            onChange={e => setTripForm({...tripForm, estimatedReachingTime: e.target.value})} />
                                    </div>
                                </div>

                                {/* Row 3: Points & Distance */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup Points</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" placeholder="Comma separated"
                                                onChange={e => setTripForm({...tripForm, pickupPoints: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Drop Points</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" placeholder="Comma separated"
                                                onChange={e => setTripForm({...tripForm, dropPoints: e.target.value})} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Distance (km)</label>
                                        <input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" required placeholder="e.g. 350"
                                            value={tripForm.totalKm || ''}
                                            onChange={e => setTripForm({...tripForm, totalKm: parseFloat(e.target.value)})} />
                                    </div>
                                </div>

                                {/* Row 4: Estimated Duration */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Duration (minutes)</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none text-white" placeholder="e.g. 120 for 2 hours"
                                        value={tripForm.estimatedDuration || ''}
                                        onChange={e => setTripForm({...tripForm, estimatedDuration: e.target.value})} />
                                    <p className="text-xs text-slate-500 mt-1">Optional: Auto-filled by AI route or enter manually</p>
                                </div>

                                <div className="pt-2">
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/40 text-sm transition-transform active:scale-[0.98]">Publish Trip</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default DriverTripsPage;
