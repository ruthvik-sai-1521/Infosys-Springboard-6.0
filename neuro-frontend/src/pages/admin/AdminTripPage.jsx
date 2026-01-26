import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminTripPage = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
                const res = await axios.get('/api/trips/all', config);
                setTrips(res.data);
            } catch (error) {
                console.error("Error fetching trips:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, []);

    const filteredTrips = trips.filter(trip => 
        !searchTerm || 
        trip.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-500/20 text-blue-400';
            case 'IN_PROGRESS': return 'bg-amber-500/20 text-amber-400';
            case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-slate-700 text-slate-300';
        }
    };

    return (
        <div className="text-white max-w-6xl mx-auto">
             <div className="flex justify-between items-center mb-8">
                <div>
                     <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Trip Management</h1>
                     <div className="text-slate-400 text-sm mt-1">Total Trips: {filteredTrips.length}</div>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search source or destination..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-72"
                />
            </div>

             {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredTrips.length === 0 ? (
                <div className="bg-slate-900/50 p-10 rounded-xl text-center border border-slate-800">
                    <p className="text-slate-400 text-lg">No trips found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredTrips.map(trip => (
                        <div key={trip.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-colors group">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-lg font-bold text-white">Trip #{trip.id}</span>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(trip.status)}`}>
                                            {trip.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-300 text-lg">
                                        <span className="font-medium text-white">{trip.source}</span>
                                        <span className="text-slate-500">➔</span>
                                        <span className="font-medium text-white">{trip.destination}</span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">
                                        📅 {new Date(trip.tripDate).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex flex-col md:items-end gap-1">
                                    <p className="text-slate-300 text-sm">
                                        Driver: <span className="text-white font-medium">{trip.driver?.username || 'Unknown'}</span>
                                    </p>
                                    {trip.vehicle && (
                                        <p className="text-slate-400 text-xs">
                                            Vehicle: {trip.vehicle.vehicleNumber} ({trip.vehicle.vehicleModel})
                                        </p>
                                    )}
                                    <div className="mt-2 bg-slate-900 px-3 py-1 rounded border border-slate-700">
                                        <span className="text-emerald-400 font-bold">₹{trip.fare}</span>
                                        <span className="text-slate-500 text-xs ml-2">per seat</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Additional Details (Collapsible or just visible) */}
                            <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-wrap gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1">
                                    💺 Seats: <span className="text-white">{trip.availableSeats} available</span>
                                </span>
                                {trip.distance > 0 && (
                                    <span className="flex items-center gap-1">
                                        📏 Distance: <span className="text-white">{trip.distance} km</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminTripPage;
