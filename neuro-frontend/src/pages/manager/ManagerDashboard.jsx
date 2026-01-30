import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Car, Users, MessageSquare, Search, Phone, Mail, AlertTriangle, Map as MapIcon, UserCircle, Briefcase, Building, MapPin } from 'lucide-react';
import { LiveMap } from '../../components/maps';

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

const ManagerDashboard = () => {
    const { user: authUser } = useAuth(); 
    const [activeSection, setActiveSection] = useState('overview');
    
    // Data States
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]); 
    const [users, setUsers] = useState([]); 
    const [reviews, setReviews] = useState([]);
    const [managerProfile, setManagerProfile] = useState(null);

    // Search & Map States
    const [userSearch, setUserSearch] = useState("");
    const [vehicleSearch, setVehicleSearch] = useState("");
    const [mapSearch, setMapSearch] = useState("");
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [selectedMapVehicle, setSelectedMapVehicle] = useState(null);

    // Contact Modal
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedContactUser, setSelectedContactUser] = useState(null);
    const [messageText, setMessageText] = useState("");

    // Vehicle Detail Modal
    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [messages, setMessages] = useState([]);

    // Admin Requests
    const [adminRequests, setAdminRequests] = useState([]);
    const [newRequest, setNewRequest] = useState({
        type: 'INQUIRY',
        subject: '',
        message: ''
    });

    const fetchData = useCallback(async () => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        try {
            const [tRes, uRes, rRes, vRes] = await Promise.all([
                axios.get('/api/trips/all', config),
                axios.get('/api/admin/users', config),
                axios.get('/api/reviews/all', config),
                axios.get('/api/admin/vehicles', config) 
            ]);
            
            setTrips(tRes.data);
            setUsers(uRes.data);
            setReviews(rRes.data);
            setVehicles(vRes.data);

            if (authUser?.username) {
                const profile = uRes.data.find(u => u.username === authUser.username);
                setManagerProfile(profile || { username: authUser.username, empId: 'MGR-001', branch: 'Main Branch' });
                
                // Fetch admin requests
                if (profile?.id) {
                    axios.get(`/api/admin-requests/my-requests/${profile.id}`, config)
                        .then(res => setAdminRequests(res.data))
                        .catch(e => console.error("Error fetching requests:", e));
                }
            }
        } catch(e) { console.error("Error fetching data:", e); }
    }, [authUser]);

    useEffect(() => { 
        fetchData(); 
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds for live updates
        return () => clearInterval(interval);
    }, [fetchData]);

    // Handle Map Search
    useEffect(() => {
        if(mapSearch.trim() === "") {
            setSelectedMapVehicle(null);
            return;
        }

        // Search in vehicles (by number) or users (by driver name)
        const foundVehicle = vehicles.find(v => 
            v.vehicleNumber.toLowerCase().includes(mapSearch.toLowerCase()) ||
            (v.driverName && v.driverName.toLowerCase().includes(mapSearch.toLowerCase()))
        );

        if (foundVehicle) {
            setSelectedMapVehicle(foundVehicle);
            // Parse Location if exists
            if(foundVehicle.currentLocation) {
                const [lat, lng] = foundVehicle.currentLocation.split(',').map(Number);
                if(!isNaN(lat) && !isNaN(lng)) setMapCenter({ lat, lng });
            }
        }
    }, [mapSearch, vehicles]);

    const handleSendMessage = async () => {
        if(!selectedContactUser) return;
        try {
            await axios.post('/api/messages/send', {
                senderId: managerProfile?.id || 1, 
                receiverId: selectedContactUser.id,
                content: messageText
            });
            alert("Message Sent!");
            setContactModalOpen(false);
            setMessageText("");
        } catch(e) { alert("Failed to send"); }
    };

    // --- SUB-SECTIONS ---

    const renderOverview = () => {
        // Helper function to format duration
        const formatDuration = (minutes) => {
            if (!minutes) return 'N/A';
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) return `${hours}h ${mins}m`;
            return `${mins}m`;
        };

        // Sort trips by date (newest first)
        const sortedTrips = [...trips].sort((a, b) => 
            new Date(b.tripDate) - new Date(a.tripDate)
        );

        // Filter into active and past trips
        const activeTrips = sortedTrips.filter(t => 
            ['SCHEDULED', 'IN_PROGRESS'].includes(t.status)
        );
        const pastTrips = sortedTrips.filter(t => 
            ['COMPLETED', 'AUTO_COMPLETED', 'CANCELLED'].includes(t.status)
        );

        // Status badge color mapping
        const getStatusColor = (status) => {
            switch(status) {
                case 'SCHEDULED': return 'bg-emerald-500/20 text-emerald-400';
                case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400';
                case 'COMPLETED': return 'bg-purple-500/20 text-purple-400';
                case 'AUTO_COMPLETED': return 'bg-cyan-500/20 text-cyan-400';
                case 'CANCELLED': return 'bg-red-500/20 text-red-400';
                default: return 'bg-slate-700 text-slate-400';
            }
        };

        const TripCard = ({ trip, isPast = false }) => (
            <div className={`p-5 bg-slate-800/50 rounded-xl border transition-colors ${isPast ? 'border-slate-700/50 hover:border-purple-500/30' : 'border-slate-700 hover:border-blue-500/30'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                            {trip.source} <span className="text-slate-500">➔</span> {trip.destination}
                        </h4>
                        <p className="text-xs text-blue-400 font-mono mt-1">ID: #{trip.id} • {new Date(trip.tripDate).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(trip.status)}`}>
                        {trip.status}
                    </span>
                </div>
                
                {/* Detailed Trip Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <p className="text-slate-500 uppercase font-bold text-[10px]">Driver</p>
                        <p className="text-white font-bold truncate">{trip.driver?.username || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <p className="text-slate-500 uppercase font-bold text-[10px]">Vehicle</p>
                        <p className="text-white font-bold truncate">{trip.vehicle?.vehicleNumber || 'N/A'}</p>
                        <p className="text-slate-400 text-[10px]">{trip.vehicle?.type}</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <p className="text-slate-500 uppercase font-bold text-[10px]">Available Seats</p>
                        <p className="text-white font-bold">{trip.availableSeats} Open</p>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <p className="text-slate-500 uppercase font-bold text-[10px]">Est. Duration</p>
                        <p className="text-white font-bold">{formatDuration(trip.estimatedDuration)}</p>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                 <div className="lg:col-span-2 space-y-6">
                    {/* Recent Trips Section */}
                    <div className="glass-panel p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-blue-400" /> Recent Trips
                        </h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {activeTrips.length === 0 ? (
                                <p className="text-slate-500">No recent trips.</p>
                            ) : (
                                activeTrips.slice(0, 10).map(t => <TripCard key={t.id} trip={t} />)
                            )}
                        </div>
                    </div>

                    {/* Past Trips Section */}
                    <div className="glass-panel p-6 rounded-xl bg-slate-900 border border-slate-800">
                        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                            <LayoutDashboard className="w-5 h-5 text-purple-400" /> Past Trips
                        </h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {pastTrips.length === 0 ? (
                                <p className="text-slate-500">No completed trips.</p>
                            ) : (
                                pastTrips.slice(0, 10).map(t => <TripCard key={t.id} trip={t} isPast={true} />)
                            )}
                        </div>
                    </div>
                 </div>

                 <div className="glass-panel p-6 rounded-xl bg-slate-900 border border-slate-800 h-fit">
                     {/* Manager Profile Card */}
                     <div className="mb-8 text-center bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
                         <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
                            <UserCircle className="w-10 h-10 text-emerald-400" />
                         </div>
                         <h3 className="text-lg font-bold text-white">{managerProfile?.username || "Manager"}</h3>
                         <p className="text-slate-400 text-sm mb-4">Fleet Manager</p>
                         
                         <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-950/50 p-3 rounded-lg">
                             <div>
                                 <p className="text-slate-500 block mb-1">Emp ID</p>
                                 <p className="text-white font-bold flex items-center gap-1"><Briefcase className="w-3 h-3"/> {managerProfile?.empId || "N/A"}</p>
                             </div>
                             <div>
                                 <p className="text-slate-500 block mb-1">Branch</p>
                                 <p className="text-white font-bold flex items-center gap-1"><Building className="w-3 h-3"/> {managerProfile?.branch || "N/A"}</p>
                             </div>
                         </div>
                     </div>

                     <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                         <AlertTriangle className="w-5 h-5 text-red-500" /> Critical Alerts
                     </h3>
                     <div className="space-y-3">
                         <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                             <p className="text-sm font-bold text-red-400">Maintenance Due</p>
                             <p className="text-xs text-slate-400 mt-1">Vehicle KA-01-AB-1234 requires service.</p>
                         </div>
                     </div>
                 </div>
            </div>
        );
    };

    const renderMap = () => {
        // Prepare vehicle data for LiveMap
        const mapVehicles = vehicles
            .filter(v => v.currentLocation)
            .map(v => {
                const [lat, lng] = v.currentLocation.split(',').map(Number);
                if (isNaN(lat) || isNaN(lng)) return null;
                return {
                    id: v.id,
                    vehicleNumber: v.vehicleNumber,
                    model: v.model,
                    type: v.type,
                    status: v.status,
                    location: { lat, lng },
                    driverName: v.driverName || 'Unassigned'
                };
            })
            .filter(Boolean);

        return (
            <div className="animate-fade-in h-[80vh] flex flex-col gap-4">
                <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <MapIcon className="w-6 h-6 text-purple-400" /> Live Fleet Tracking
                    </h2>
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Search Driver or Vehicle Number..." 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                            value={mapSearch}
                            onChange={e => setMapSearch(e.target.value)}
                        />
                    </div>
                </div>
    
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative flex-1">
                    <LiveMap 
                        vehicles={mapVehicles} 
                        center={selectedMapVehicle ? {
                            lat: Number(selectedMapVehicle.currentLocation.split(',')[0]),
                            lng: Number(selectedMapVehicle.currentLocation.split(',')[1]) 
                        } : undefined}
                        className="h-full w-full"
                    />
                    
                    {/* Overlay Info box if search found */}
                    {selectedMapVehicle && (
                         <div className="absolute bottom-4 left-4 bg-slate-900/90 p-4 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm z-[1000] w-80">
                             <div className="flex justify-between items-start mb-2">
                                 <h3 className="font-bold text-white text-lg">{selectedMapVehicle.vehicleNumber}</h3>
                                 <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">{selectedMapVehicle.status}</span>
                             </div>
                             <p className="text-slate-400 text-sm mb-1">Driver: <span className="text-white">{selectedMapVehicle.driverName || "Unassigned"}</span></p>
                             <p className="text-slate-400 text-sm mb-3">Model: {selectedMapVehicle.model} ({selectedMapVehicle.type})</p>
                             <p className="text-xs text-slate-500 flex items-center gap-1">
                                 <MapPin className="w-3 h-3" /> Location: {selectedMapVehicle.currentLocation || "Unknown"}
                             </p>
                         </div>
                    )}
                </div>
            </div>
        );
    };

    // Handle vehicle click to open detail modal
    const handleVehicleClick = async (vehicle) => {
        setSelectedVehicle(vehicle);
        setVehicleModalOpen(true);
        
        // Fetch messages for this driver if exists
        if (vehicle.driverId) {
            try {
                const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
                const messagesRes = await axios.get(`/api/messages/conversation/${managerProfile?.id}/${vehicle.driverId}`, config);
                setMessages(messagesRes.data || []);
            } catch(e) {
                console.error("Error fetching messages:", e);
                setMessages([]);
            }
        }
    };

    // Handle Live button click
    const handleLiveClick = (vehicle) => {
        if (vehicle.currentLocation) {
            const [lat, lng] = vehicle.currentLocation.split(',').map(Number);
            if (!isNaN(lat) && !isNaN(lng)) {
                setMapCenter({ lat, lng });
                setSelectedMapVehicle(vehicle);
                setActiveSection('map');
            }
        }
    };

    const renderFleet = () => {
        return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Full Verified Fleet</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search vehicle..." 
                        className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={vehicleSearch}
                        onChange={e => setVehicleSearch(e.target.value)}
                    />
                </div>
             </div>
             
             {/* Only Show Verified/Available Vehicles */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles
                    .filter(v => 
                        // Show all that are NOT pending or rejected, i.e., APPROVED/AVAILABLE
                        (v.status !== 'PENDING_ADMIN_APPROVAL' && v.status !== 'REJECTED') &&
                        v.vehicleNumber?.toLowerCase().includes(vehicleSearch.toLowerCase())
                    )
                    .map(v => (
                    <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors group cursor-pointer" onClick={() => handleVehicleClick(v)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-800 p-3 rounded-lg"><Car className="w-6 h-6 text-emerald-400" /></div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${v.status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>{v.status}</span>
                        </div>
                        <h4 className="font-bold text-lg text-white">{v.vehicleNumber}</h4>
                        <div className="flex justify-between items-end mt-2">
                            <div>
                                <p className="text-sm text-slate-400">{v.type}</p>
                                <p className="text-xs text-slate-500">{v.model}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-500 uppercase">Assigned Driver</p>
                                <p className="text-sm text-white font-bold">{v.driverName || users.find(u => u.id === v.driverId)?.username || "Unassigned"}</p>
                            </div>
                        </div>
                        
                        {/* Only Real Data - No Dummy Locations */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                         <span className="flex items-center gap-1 text-slate-500"><Users className="w-3 h-3"/> {v.seatCount || 4} Seats</span>
                         {v.currentLocation ? (
                             <button 
                                 onClick={(e) => { e.stopPropagation(); handleLiveClick(v); }} 
                                 className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
                             >
                                 <MapPin className="w-3 h-3" /> View on Map
                             </button>
                         ) : <span className="text-slate-500">No location</span>}
                    </div>
                    </div>
                ))}
                {vehicles.length === 0 && <p className="text-slate-500 col-span-full">No verified vehicles found.</p>}
         </div>
    </div>
        );
    };

    const renderUsers = () => (
         <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Driver & Customer Directory</h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                    />
                </div>
             </div>
             
             <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {users
                            .filter(u => u.username?.toLowerCase().includes(userSearch.toLowerCase()))
                            .map(u => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                        {u.username?.[0]}
                                    </div>
                                    {u.username}
                                </td>
                                <td className="p-4 text-sm text-slate-400">{u.email}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded border ${u.role === 'DRIVER' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs ${u.verificationStatus === 'APPROVED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {u.verificationStatus || 'N/A'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setSelectedContactUser(u); setContactModalOpen(true); }} className="p-2 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20" title="Message"><MessageSquare className="w-4 h-4" /></button>
                                        <a href={`tel:${u.mobileNumber}`} className="p-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20" title="Call"><Phone className="w-4 h-4" /></a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
         </div>
    );

    const renderFeedback = () => (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-white mb-6">Customer & Driver Feedback</h2>
             <div className="grid grid-cols-1 gap-4">
                {reviews.map(r => (
                    <div key={r.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-shrink-0 flex items-center justify-center bg-slate-950 w-16 h-16 rounded-xl border border-slate-800">
                                <span className="text-2xl font-bold text-amber-500 flex flex-col items-center leading-none">
                                    {r.rating}<span className="text-[10px] text-slate-500 mt-1">/5</span>
                                </span>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs font-bold">CUSTOMER</span>
                                    <span className="text-white font-bold">{r.customer?.username}</span>
                                    <span className="text-slate-600">➔</span>
                                    <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded text-xs font-bold">DRIVER</span>
                                    <span className="text-white font-bold">{r.driver?.username}</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed italic border-l-2 border-slate-700 pl-4 py-1">"{r.feedback}"</p>
                                <p className="text-xs text-slate-600 mt-3 text-right">Received on: {new Date(r.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {reviews.length === 0 && <p className="text-slate-500">No feedbacks received yet.</p>}
             </div>
        </div>
    );

    const renderAdminRequests = () => {
        const handleSubmitRequest = async () => {
            if (!newRequest.subject || !newRequest.message) {
                alert("Please fill in all fields");
                return;
            }

            try {
                const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
                await axios.post('/api/admin-requests/create', {
                    senderId: managerProfile?.id,
                    type: newRequest.type,
                    subject: newRequest.subject,
                    message: newRequest.message
                }, config);

                alert("Request sent successfully!");
                setNewRequest({ type: 'INQUIRY', subject: '', message: '' });
                fetchData(); // Refresh requests
            } catch(e) {
                alert("Failed to send request");
                console.error(e);
            }
        };

        const getStatusColor = (status) => {
            switch(status) {
                case 'PENDING': return 'bg-amber-500/20 text-amber-400';
                case 'READ': return 'bg-blue-500/20 text-blue-400';
                case 'RESPONDED': return 'bg-emerald-500/20 text-emerald-400';
                default: return 'bg-slate-700 text-slate-400';
            }
        };

        const getTypeLabel = (type) => {
            switch(type) {
                case 'INQUIRY': return 'General Inquiry';
                case 'VEHICLE_REQUEST': return 'Vehicle Approval';
                case 'DRIVER_ISSUE': return 'Driver Issue';
                case 'FEEDBACK': return 'System Feedback';
                default: return type;
            }
        };

        return (
            <div className="animate-fade-in space-y-6">
                {/* Send Request Form */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-400" /> Send Request to Admin
                    </h2>
                    
                    <div className="space-y-4">
                        {/* Request Type */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 block mb-2">Request Type</label>
                            <select 
                                value={newRequest.type}
                                onChange={e => setNewRequest({...newRequest, type: e.target.value})}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                            >
                                <option value="INQUIRY">General Inquiry</option>
                                <option value="VEHICLE_REQUEST">Vehicle Approval Request</option>
                                <option value="DRIVER_ISSUE">Driver Issue Report</option>
                                <option value="FEEDBACK">System Feedback</option>
                            </select>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 block mb-2">Subject</label>
                            <input 
                                type="text"
                                value={newRequest.subject}
                                onChange={e => setNewRequest({...newRequest, subject: e.target.value})}
                                placeholder="Brief subject line..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="text-sm font-bold text-slate-400 block mb-2">Message</label>
                            <textarea 
                                value={newRequest.message}
                                onChange={e => setNewRequest({...newRequest, message: e.target.value})}
                                placeholder="Describe your request in detail..."
                                rows="5"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none resize-none"
                            />
                        </div>

                        <button 
                            onClick={handleSubmitRequest}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/40 transition-colors"
                        >
                            Send Request
                        </button>
                    </div>
                </div>

                {/* Requests List */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h2 className="text-2xl font-bold text-white mb-6">My Requests</h2>
                    
                    <div className="space-y-4">
                        {adminRequests.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No requests sent yet</p>
                        ) : (
                            adminRequests.map(request => (
                                <div key={request.id} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded font-bold">
                                                {getTypeLabel(request.type)}
                                            </span>
                                            <h3 className="text-lg font-bold text-white mt-2">{request.subject}</h3>
                                            <p className="text-slate-400 text-sm mt-1">{request.message}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(request.status)}`}>
                                            {request.status}
                                        </span>
                                    </div>

                                    {request.response && (
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <p className="text-xs text-emerald-400 font-bold mb-2">Admin Response:</p>
                                            <p className="text-white text-sm bg-slate-900 p-3 rounded-lg">{request.response}</p>
                                            <p className="text-xs text-slate-500 mt-2">
                                                Responded: {new Date(request.respondedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-500 mt-3">
                                        Sent: {new Date(request.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const SidebarItem = ({ icon, label, active, onClick }) => (
        <button 
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${active ? 'bg-blue-600 shadow-lg shadow-blue-900/40 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
        >
            <div className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{icon}</div>
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white flex font-sans">
             {/* SIDEBAR */}
             <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-40 shadow-2xl">
                 <div className="p-6 border-b border-slate-800">
                     <h1 className="text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Manager Portal</h1>
                 </div>
                 <nav className="flex-1 p-4 space-y-2">
                     <SidebarItem icon={<LayoutDashboard />} label="Overview" active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} />
                     <SidebarItem icon={<MapIcon />} label="Live Map" active={activeSection === 'map'} onClick={() => setActiveSection('map')} />
                     <SidebarItem icon={<Car />} label="Fleet" active={activeSection === 'fleet'} onClick={() => setActiveSection('fleet')} />
                     <SidebarItem icon={<Users />} label="Directory" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
                     <SidebarItem icon={<MessageSquare />} label="Feedbacks" active={activeSection === 'feedback'} onClick={() => setActiveSection('feedback')} />
                     <SidebarItem icon={<Mail />} label="Admin Requests" active={activeSection === 'requests'} onClick={() => setActiveSection('requests')} />
                 </nav>
                 <div className="p-4 border-t border-slate-800">
                     <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">{managerProfile?.username?.[0]}</div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{managerProfile?.username}</p>
                                <p className="text-xs text-slate-500 truncate">{managerProfile?.email}</p>
                            </div>
                     </div>
                     <button onClick={() => window.location.href='/login'} className="w-full py-2 bg-slate-800 text-red-400 text-sm font-bold rounded-lg hover:bg-slate-700 border border-slate-700 hover:border-red-500/30 transition-all">Logout</button>
                 </div>
             </div>

             {/* MAIN CONTENT */}
             <div className="flex-1 ml-64">
                <Navbar /> 
                <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto">
                    {activeSection === 'overview' && renderOverview()}
                    {activeSection === 'map' && renderMap()}
                    {activeSection === 'fleet' && renderFleet()}
                    {activeSection === 'users' && renderUsers()}
                    {activeSection === 'feedback' && renderFeedback()}
                    {activeSection === 'requests' && renderAdminRequests()}
                </div>
             </div>

             {/* CONTACT MODAL */}
             {contactModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button onClick={() => setContactModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                        <h3 className="text-lg font-bold text-white mb-2">Message {selectedContactUser?.username}</h3>
                        <div className="flex gap-4 mb-6">
                            <a href={`tel:${selectedContactUser?.mobileNumber}`} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors">
                                <Phone className="w-4 h-4 text-emerald-400" /> Call Now
                            </a>
                            <a href={`mailto:${selectedContactUser?.email}`} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors">
                                <Mail className="w-4 h-4 text-blue-400" /> Email
                            </a>
                        </div>
                        <p className="text-xs text-slate-500 mb-2 uppercase font-bold">Send In-App Message</p>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-blue-500 outline-none h-24 resize-none mb-4"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={e => setMessageText(e.target.value)}
                        />
                        <button onClick={handleSendMessage} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-900/40">Send Message</button>
                    </div>
                 </div>
             )}

             {/* VEHICLE DETAIL MODAL */}
             {vehicleModalOpen && selectedVehicle && (() => {
                 const driver = users.find(u => u.id === selectedVehicle.driverId);
                 const driverTrips = trips.filter(t => t.driver?.id === selectedVehicle.driverId);
                 const driverFeedbacks = reviews.filter(r => r.driver?.id === selectedVehicle.driverId);
                 
                 return (
                     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
                         <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl relative my-8">
                             {/* Header */}
                             <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-t-2xl border-b border-slate-700">
                                 <button onClick={() => setVehicleModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-2xl">✕</button>
                                 <div className="flex items-center gap-4">
                                     <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                         <Car className="w-8 h-8 text-emerald-400" />
                                     </div>
                                     <div>
                                         <h2 className="text-2xl font-bold text-white">{selectedVehicle.vehicleNumber}</h2>
                                         <p className="text-slate-400">{selectedVehicle.type} • {selectedVehicle.model}</p>
                                     </div>
                                     <span className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${selectedVehicle.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                         {selectedVehicle.status}
                                     </span>
                                 </div>
                             </div>

                             {/* Content */}
                             <div className="p-6 max-h-[70vh] overflow-y-auto">
                                 {/* Vehicle Info Grid */}
                                 <div className="grid grid-cols-3 gap-4 mb-6">
                                     <div className="bg-slate-800/50 p-4 rounded-xl">
                                         <p className="text-slate-500 text-xs uppercase mb-1">Seat Capacity</p>
                                         <p className="text-white font-bold text-lg">{selectedVehicle.seatCount || 4}</p>
                                     </div>
                                     <div className="bg-slate-800/50 p-4 rounded-xl">
                                         <p className="text-slate-500 text-xs uppercase mb-1">Kilometers</p>
                                         <p className="text-white font-bold text-lg">{selectedVehicle.kilometersDriven || 0} km</p>
                                     </div>
                                     <div className="bg-slate-800/50 p-4 rounded-xl">
                                         <p className="text-slate-500 text-xs uppercase mb-1">Location</p>
                                         <p className="text-white font-bold text-sm truncate">{selectedVehicle.currentLocation || 'N/A'}</p>
                                     </div>
                                 </div>

                                 {driver ? (
                                     <>
                                         {/* Driver Details */}
                                         <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-6 rounded-xl border border-blue-800/30 mb-6">
                                             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                 <UserCircle className="w-5 h-5 text-blue-400" /> Assigned Driver
                                             </h3>
                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                 <div>
                                                     <p className="text-slate-500 text-xs mb-1">Name</p>
                                                     <p className="text-white font-bold">{driver.username}</p>
                                                 </div>
                                                 <div>
                                                     <p className="text-slate-500 text-xs mb-1">Email</p>
                                                     <p className="text-white font-bold truncate">{driver.email}</p>
                                                 </div>
                                                 <div>
                                                     <p className="text-slate-500 text-xs mb-1">Phone</p>
                                                     <p className="text-white font-bold">{driver.mobileNumber}</p>
                                                 </div>
                                                 <div>
                                                     <p className="text-slate-500 text-xs mb-1">Avg Rating</p>
                                                     <p className="text-amber-400 font-bold">4.8/5</p>
                                                 </div>
                                             </div>
                                         </div>
                                     </>
                                 ) : (
                                     <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed text-center mb-6">
                                         <p className="text-slate-500 italic">No driver currently assigned to this vehicle.</p>
                                     </div>
                                 )}

                                 {/* Messages Section */}
                                 <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                                     <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                         <MessageSquare className="w-5 h-5 text-slate-400" /> Communication History
                                     </h3>
                                     
                                     {messages.length > 0 ? (
                                         <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                                             {messages.map(msg => (
                                                 <div key={msg.id} className={`p-3 rounded-lg max-w-[80%] ${msg.senderId === managerProfile?.id ? 'ml-auto bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                                                     <p className="text-sm">{msg.content}</p>
                                                     <p className="text-[10px] opacity-70 mt-1 text-right">{new Date(msg.sentAt).toLocaleString()}</p>
                                                 </div>
                                             ))}
                                         </div>
                                     ) : (
                                         <p className="text-slate-500 text-center py-4">No recent messages with this driver.</p>
                                     )}

                                     <button 
                                         disabled={!driver}
                                         onClick={() => {
                                             if(driver) {
                                                 setVehicleModalOpen(false);
                                                 setSelectedContactUser(driver);
                                                 setContactModalOpen(true);
                                             }
                                         }}
                                         className={`w-full py-3 rounded-lg font-bold transition-colors ${driver ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                                     >
                                         Send New Message
                                     </button>
                                 </div>
                             </div>
                         </div>
                     </div>
                 );
             })()}
        </div>
    );
};

export default ManagerDashboard;
