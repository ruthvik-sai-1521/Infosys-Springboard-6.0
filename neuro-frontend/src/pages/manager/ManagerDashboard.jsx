import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Car, Users, MessageSquare, Wrench, Search, Phone, Mail, AlertTriangle, Map as MapIcon, UserCircle, Briefcase, Building, MapPin } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const defaultCenter = { lat: 12.9716, lng: 77.5946 };
const mapContainerStyle = { width: '100%', height: '100%' };

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

    // Google Maps Loader
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "", 
        preventGoogleFontsLoading: true
    });

    // Contact Modal
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedContactUser, setSelectedContactUser] = useState(null);
    const [messageText, setMessageText] = useState("");

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

    const renderOverview = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             <div className="lg:col-span-2 glass-panel p-6 rounded-xl bg-slate-900 border border-slate-800">
                <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" /> Live Trip Monitoring
                </h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {trips.length === 0 ? <p className="text-slate-500">No active trips.</p> : (
                        trips.map(t => (
                            <div key={t.id} className="p-5 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-white text-lg flex items-center gap-2">
                                            {t.source} <span className="text-slate-500">➔</span> {t.destination}
                                        </h4>
                                        <p className="text-xs text-blue-400 font-mono mt-1">ID: #{t.id} • {new Date(t.tripDate).toLocaleString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status === 'SCHEDULED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {t.status}
                                    </span>
                                </div>
                                
                                {/* Detailed Trip Info Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <p className="text-slate-500 uppercase font-bold text-[10px]">Driver</p>
                                        <p className="text-white font-bold truncate">{t.driver?.username}</p>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <p className="text-slate-500 uppercase font-bold text-[10px]">Vehicle</p>
                                        <p className="text-white font-bold truncate">{t.vehicle?.vehicleNumber}</p>
                                        <p className="text-slate-400 text-[10px]">{t.vehicle?.model}</p>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <p className="text-slate-500 uppercase font-bold text-[10px]">Bookings</p>
                                        <p className="text-white font-bold">{t.availableSeats} Open</p>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                                        <p className="text-slate-500 uppercase font-bold text-[10px]">Est. Time</p>
                                        <p className="text-white font-bold">{t.estimatedReachingTime || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
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

    const renderMap = () => (
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
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={14}
                        options={{
                            disableDefaultUI: false,
                            styles: [
                                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
                            ]
                        }}
                    >
                        {/* Show Marker for Selected Vehicle */}
                        {selectedMapVehicle && (
                            <Marker 
                                position={mapCenter} 
                                title={selectedMapVehicle.vehicleNumber}
                            />
                        )}
                        
                        {/* Show All Vehicles (Optional: you can map all vehicles to markers here) */}
                        {!selectedMapVehicle && vehicles.map(v => {
                            if(!v.currentLocation) return null;
                            const [lat, lng] = v.currentLocation.split(',').map(Number);
                            if(isNaN(lat) || isNaN(lng)) return null;
                            return <Marker key={v.id} position={{lat, lng}} title={v.vehicleNumber} />;
                        })}

                    </GoogleMap>
                ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                         <div className="text-center">
                             <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                 <MapPin className="w-10 h-10 text-blue-500" />
                             </div>
                             <p className="text-slate-400 font-bold mb-2">Map Loading / API Key Missing</p>
                         </div>
                    </div>
                )}
                
                {/* Overlay Info box if search found */}
                {selectedMapVehicle && (
                     <div className="absolute bottom-4 left-4 bg-slate-900/90 p-4 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-sm z-10 w-80">
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

    const renderFleet = () => (
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
                    <div key={v.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-colors group">
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
                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                             <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {v.seatCount || 4} Seats</span>
                             {v.currentLocation ? (
                                 <span className="flex items-center gap-1 text-emerald-400"><MapPin className="w-3 h-3" /> Live</span>
                             ) : <span>No loc data</span>}
                        </div>
                    </div>
                ))}
                {vehicles.length === 0 && <p className="text-slate-500 col-span-full">No verified vehicles found.</p>}
             </div>
        </div>
    );

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
                </div>
             </div>

             {/* CONTACT MODAL */}
             {contactModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                         {/* ... modal content reused ... */}
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
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            active 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
        {React.cloneElement(icon, { size: 18 })}
        {label}
    </button>
);

export default ManagerDashboard;
