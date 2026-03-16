import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { Calendar, Clock, MapPin, ArrowLeft, PlusCircle, Users, Phone, X, Route, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RouteSelector, VehicleTracker, LiveMap } from '../../components/maps';
import routeService from '../../services/routeService';

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

    // Route Selection State
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [routeTrip, setRouteTrip] = useState(null);
    const [availableRoutes, setAvailableRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Live Tracking State
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingTrip, setTrackingTrip] = useState(null);

    // Map & Route State (for viewing route)
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [mapTrip, setMapTrip] = useState(null);
    const [mapRouteData, setMapRouteData] = useState(null);

    const [tripForm, setTripForm] = useState({
        source: '',
        destination: '',
        date: '',
        time: '',
        availableSeats: 3,
        vehicleId: '',
        estimatedReachingTime: '', 
        estimatedDuration: '',
        pickupPoints: '', 
        dropPoints: '', 
        totalKm: '', 
        description: '' 
    });

    const driverId = user?.id;

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

    const fetchBookingsForTrip = async (trip) => {
        setSelectedTrip(trip);
        setLoadingBookings(true);
        try {
            const res = await axios.get(`/api/bookings/trip/${trip.id}`);
            setBookings(res.data);
            
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTripForm(prev => {
            const newForm = { ...prev, [name]: value };
            
            // If vehicle changes, update max seats
            if (name === 'vehicleId') {
                const selected = vehicles.find(v => v.id === Number(value));
                if (selected) {
                    newForm.availableSeats = selected.seatCount || 5; 
                }
            }
            return newForm;
        });
    };

    const handlePostTrip = async () => {
        if (!tripForm.source || !tripForm.destination || !tripForm.date || !tripForm.time || !tripForm.vehicleId) {
            alert("Please fill all required fields (From, To, Date, Time, Vehicle).");
            return;
        }

        // Verify authentication token exists
        const token = localStorage.getItem('token');
        if (!token) {
            alert("❌ Authentication Error: You are not logged in. Please login again.");
            console.error("No authentication token found. User needs to login.");
            return;
        }

        console.log("✅ Authentication token found. Posting trip...");

        const tripDate = `${tripForm.date}T${tripForm.time}:00`;

        const payload = {
            driverId,
            vehicleId: Number(tripForm.vehicleId),
            source: tripForm.source,
            destination: tripForm.destination,
            tripDate: tripDate,
            availableSeats: parseInt(tripForm.availableSeats) || 3,
            estimatedDuration: tripForm.estimatedDuration ? parseInt(tripForm.estimatedDuration) : 60,
            estimatedReachingTime: tripForm.estimatedReachingTime || '',
            pickupPoints: tripForm.pickupPoints || '',
            dropPoints: tripForm.dropPoints || '',
            totalKm: parseFloat(tripForm.totalKm) || 0
        };

        try {
            await axios.post('/api/trips/create', payload);
            alert("Trip posted successfully! Fare calculated automatically based on vehicle type.");
            setIsPostModalOpen(false);
            setTripForm({
                source: '',
                destination: '',
                date: '',
                time: '',
                availableSeats: 3,
                vehicleId: '',
                estimatedReachingTime: '',
                estimatedDuration: '',
                pickupPoints: '',
                dropPoints: '',
                totalKm: '',
                description: ''
            });
            fetchTrips();
        } catch (err) {
            console.error("Trip posting error:", err);
            
            // Enhanced error handling
            if (err.response?.status === 401) {
                alert("❌ Authentication Error: Your session has expired. Please login again.");
                console.error("401 Unauthorized: Token may be expired or invalid");
            } else if (err.response?.status === 403) {
                alert("❌ Permission Denied: You don't have permission to post trips.");
            } else {
                const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
                alert("Failed to post trip: " + errorMsg);
            }
        }
    };

    // --- ROUTE SELECTION --- //
    const handleViewAvailableRoutes = async (trip) => {
        setRouteTrip(trip);
        setIsRouteModalOpen(true);
        setLoadingRoutes(true);
        setAvailableRoutes([]);
        setSelectedRoute(null);

        let origin = trip.source;
        let destination = trip.destination;

        if (trip.pickupPoints && trip.pickupPoints.trim() !== '') {
            const pickups = trip.pickupPoints.split(',').map(p => p.trim()).filter(p => p);
            if (pickups.length > 0) origin = pickups[0];
        }

        if (trip.dropPoints && trip.dropPoints.trim() !== '') {
            const drops = trip.dropPoints.split(',').map(d => d.trim()).filter(d => d);
            if (drops.length > 0) destination = drops[drops.length - 1];
        }

        try {
            const routes = await routeService.getDirections(origin, destination);
            setAvailableRoutes(routes);
        } catch (err) {
            console.error('Failed to fetch routes:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Could not load routes';
            alert(`Route Error: ${errorMessage}. \n\nCheck addresses and try again.`);
        }
        setLoadingRoutes(false);
    };

    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
    };

    const handleStartTripWithRoute = async () => {
        if (!selectedRoute) {
            alert('Please select a route first.');
            return;
        }

        try {
            // Save selected route
            await routeService.saveSelectedRoute(routeTrip.id, selectedRoute);
            
            // Start trip
            await axios.post(`/api/trips/${routeTrip.id}/start`);
            
            // Start simulation
            await axios.post(`/api/simulation/start-from-trip`, {
                tripId: routeTrip.id
            });

            alert("Trip started! Live tracking is active.");
            setIsRouteModalOpen(false);
            fetchTrips();
            
            setTimeout(() => {
                const updatedTrip = trips.find(t => t.id === routeTrip.id);
                if (updatedTrip) {
                    handleViewLiveTracking(updatedTrip);
                }
            }, 1000);
        } catch (err) {
            console.error(err);
            alert("Failed to start trip.");
        }
    };

    // Legacy quick start (compatibility)
    const handleStartTrip = async (trip) => {
        try {
            await axios.post(`/api/trips/${trip.id}/start`);
            await axios.post(`/api/simulation/start-from-trip`, { tripId: trip.id });
            alert("Trip started! Live tracking is active.");
            fetchTrips();
        } catch (err) {
            console.error(err);
            alert("Failed to start trip.");
        }
    };

    const handleEndTrip = async (trip) => {
        if (!window.confirm('Are you sure you want to end this trip?')) {
            return;
        }

        try {
            await axios.post(`/api/trips/${trip.id}/end`);
            // Vehicle might not be in trip object if not refreshed, handle gracefully
            if (trip.vehicle && trip.vehicle.id) {
                await axios.post(`/api/simulation/stop`, { vehicleId: trip.vehicle.id });
            }
            alert("Trip ended successfully.");
            setIsTrackingModalOpen(false);
            fetchTrips();
        } catch (err) {
            console.error(err);
            alert("Failed to end trip.");
        }
    };

    const handleViewLiveTracking = (trip) => {
        setTrackingTrip(trip);
        setIsTrackingModalOpen(true);
    };

    const handleViewRoute = async (trip) => {
        setMapTrip(trip);
        setIsMapModalOpen(true);
        setMapRouteData(null);

        try {
            const routeDetails = await routeService.getTripRoute(trip.id);
            if (routeDetails.decodedCoordinates) {
                 setMapRouteData({
                    coordinates: routeDetails.decodedCoordinates.map(c => [c.latitude, c.longitude]),
                    source: {
                        lat: routeDetails.sourceCoordinates?.latitude,
                        lng: routeDetails.sourceCoordinates?.longitude,
                        name: routeDetails.sourceCoordinates?.address
                    },
                    destination: {
                        lat: routeDetails.destinationCoordinates?.latitude,
                        lng: routeDetails.destinationCoordinates?.longitude,
                        name: routeDetails.destinationCoordinates?.address
                    }
                });
            }
        } catch (e) {
            console.error("Failed to load map route", e);
        }
    };

    // Filter Logic — status-based + time fallback for trips without explicit end
    const isPastTrip = (t) => {
        if (t.status === 'COMPLETED' || t.status === 'AUTO_COMPLETED') return true;
        // If still SCHEDULED/IN_PROGRESS but scheduled time + duration has passed → treat as past
        if (t.tripDate) {
            const durationMins = t.estimatedDuration > 0 ? t.estimatedDuration : 60;
            const expectedEnd = new Date(new Date(t.tripDate).getTime() + durationMins * 60000);
            if (expectedEnd < new Date()) return true;
        }
        return false;
    };
    const upcomingTrips  = trips.filter(t => !isPastTrip(t));
    const completedTrips = trips.filter(t => isPastTrip(t));
    const displayedTrips = activeTab === 'upcoming' ? upcomingTrips : completedTrips;

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            <Navbar />
            
             <div className="pt-24 max-w-7xl mx-auto px-6 animate-fade-in">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <button 
                            onClick={() => navigate('/driver')}
                            className="flex items-center text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">Trip Management</h1>
                        
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
                                        {/* View Route + Quick Start only for SCHEDULED trips */}
                                        {trip.status === 'SCHEDULED' && (
                                            <>
                                                <button 
                                                    onClick={() => handleViewAvailableRoutes(trip)} 
                                                    className="text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <Route className="w-3 h-3" /> View Routes
                                                </button>
                                                <button 
                                                    onClick={() => handleStartTrip(trip)} 
                                                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    Quick Start
                                                </button>
                                            </>
                                        )}

                                        {/* Live Tracking + End Trip only for IN_PROGRESS trips in Upcoming tab */}
                                        {trip.status === 'IN_PROGRESS' && activeTab === 'upcoming' && (
                                            <>
                                                <button 
                                                    onClick={() => handleViewLiveTracking(trip)} 
                                                    className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                                                >
                                                    <Gauge className="w-3 h-3" /> Live Track
                                                </button>
                                                <button 
                                                    onClick={() => handleEndTrip(trip)} 
                                                    className="text-xs font-bold bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg transition-colors"
                                                >
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

                {/* MODAL: POST NEW TRIP */}
                {isPostModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in flex flex-col">
                            <div className="flex justify-between items-center p-6 border-b border-slate-800 flex-shrink-0">
                                <h2 className="text-2xl font-bold text-white">Post New Trip</h2>
                                <button onClick={() => setIsPostModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                            </div>
                            
                            <div className="overflow-y-auto flex-1 p-6">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">FROM</label>
                                    <input 
                                        type="text" 
                                        name="source" 
                                        value={tripForm.source} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        placeholder="Source" 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">TO</label>
                                    <input 
                                        type="text" 
                                        name="destination" 
                                        value={tripForm.destination} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        placeholder="Destination" 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">DATE</label>
                                    <input 
                                        type="date" 
                                        name="date" 
                                        value={tripForm.date} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">TIME</label>
                                    <input 
                                        type="time" 
                                        name="time" 
                                        value={tripForm.time} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">VEHICLE</label>
                                    <select
                                        name="vehicleId"
                                        value={tripForm.vehicleId}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                                        required
                                    >
                                        <option value="">-- Select --</option>
                                        {vehicles.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.vehicleNumber} - {v.model}
                                            </option>
                                        ))}
                                    </select>
                                    {vehicles.length === 0 && (
                                        <p className="text-xs text-red-400 mt-1">
                                            No vehicles found. Add a vehicle here first.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">EST. REACHING TIME</label>
                                    <input 
                                        type="text" 
                                        name="estimatedDuration" 
                                        value={tripForm.estimatedDuration} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        placeholder="e.g. 5 Hours or 8:30 PM" 
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-400 text-sm font-medium">PICKUP POINTS</label>
                                    <input 
                                        type="text" 
                                        name="pickupPoints" 
                                        value={tripForm.pickupPoints} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        placeholder="Comma separated" 
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-400 text-sm font-medium">DROP POINTS</label>
                                    <input 
                                        type="text" 
                                        name="dropPoints" 
                                        value={tripForm.dropPoints} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        placeholder="Comma separated" 
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">TOTAL DISTANCE (KM)</label>
                                    <input 
                                        type="number" 
                                        name="totalKm" 
                                        value={tripForm.totalKm} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        placeholder="e.g. 350" 
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 text-sm font-medium">SEATS AVAILABLE</label>
                                    <input 
                                        type="number" 
                                        name="availableSeats" 
                                        value={tripForm.availableSeats} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
                                        min="1" 
                                        max={vehicles.find(v => v.id === Number(tripForm.vehicleId))?.seatCount || 5}
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Max Capacity: {vehicles.find(v => v.id === Number(tripForm.vehicleId))?.seatCount || 5}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-400 text-sm font-medium">DESCRIPTION</label>
                                    <textarea 
                                        name="description" 
                                        value={tripForm.description} 
                                        onChange={handleInputChange} 
                                        className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none h-20 resize-none" 
                                        placeholder="Any additional details about the trip..."
                                    ></textarea>
                                </div>
                            </div>
                            
                            <button type="button" onClick={handlePostTrip} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors mt-4">Publish Trip</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL FOR ROUTE SELECTION */}
                {isRouteModalOpen && routeTrip && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                            <div className="p-5 border-b border-slate-800 bg-slate-950">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-white">Choose Your Route</h2>
                                        <p className="text-xs text-slate-400">{routeTrip.source} ➔ {routeTrip.destination}</p>
                                    </div>
                                    <button onClick={() => setIsRouteModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                                </div>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                <RouteSelector
                                    routes={availableRoutes}
                                    selectedIndex={availableRoutes.findIndex(r => r === selectedRoute)}
                                    // Make sure route prop is passed if the component expects it for rendering list
                                    // The RouteSelector I created takes 'routes' array.
                                    onRouteSelect={(index) => handleSelectRoute(availableRoutes[index])}
                                    isLoading={loadingRoutes}
                                />
                            </div>

                            {selectedRoute && (
                                <div className="p-5 border-t border-slate-800 bg-slate-950">
                                    <button
                                        onClick={handleStartTripWithRoute}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Gauge className="w-5 h-5" /> Start Trip with Selected Route
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODAL FOR LIVE TRACKING */}
                {isTrackingModalOpen && trackingTrip && (
                    <div className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 pt-20 animate-fade-in overflow-y-auto">
                        <div className="bg-slate-900 w-full max-w-6xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in mb-20">
                            <div className="p-5 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Gauge className="w-5 h-5 text-emerald-500 animate-pulse" /> Live Tracking
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {trackingTrip.source} ➔ {trackingTrip.destination}
                                    </p>
                                </div>
                                <button onClick={() => setIsTrackingModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                            </div>
                            
                            <div className="p-6">
                                <VehicleTracker
                                    vehicleId={trackingTrip.vehicle?.id}
                                    tripId={trackingTrip.id}
                                    vehicleName={`${trackingTrip.vehicle?.model || 'Vehicle'} - ${trackingTrip.vehicle?.licensePlate || ''}`}
                                    // Route polyline is auto-fetched by VehicleTracker if tripId is present,
                                    // but we can pass it if we have it locally to save a call.
                                    // TrackingTrip might not have it loaded unless we selected it in this session.
                                    showProgress={true}
                                    height={500}
                                    onComplete={() => {
                                        alert('Trip completed!');
                                        setIsTrackingModalOpen(false);
                                        fetchTrips();
                                    }}
                                />

                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => handleEndTrip(trackingTrip)}
                                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                                    >
                                        End Trip
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* OLD MAP MODAL REPLACED WITH LIVE MAP VIEW */}
                {isMapModalOpen && mapTrip && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
                            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                                <h3 className="text-white font-bold ml-2">Trip Route</h3>
                                <button onClick={() => setIsMapModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="flex-1 w-full relative">
                                <LiveMap 
                                    className="h-full w-full"
                                    route={mapRouteData}
                                    // Pass simpler vehicle object if we just want to create a marker at source or start
                                    vehicles={[]} 
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverTripsPage;
