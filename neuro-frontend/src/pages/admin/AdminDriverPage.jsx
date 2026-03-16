import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDriverPage = () => {
    const [activeTab, setActiveTab] = useState('pending_drivers');
    
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [pendingVehicles, setPendingVehicles] = useState([]);
    const [activeDrivers, setActiveDrivers] = useState([]);
    const [activeVehicles, setActiveVehicles] = useState([]);
    const [blockedDrivers, setBlockedDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'pending_drivers', label: 'Pending Drivers', count: pendingDrivers.length },
        { id: 'pending_vehicles', label: 'Pending Vehicles', count: pendingVehicles.length },
        { id: 'active_drivers', label: 'Active Drivers', count: activeDrivers.length },
        { id: 'blocked_drivers', label: 'Blocked Drivers', count: blockedDrivers.length },
        { id: 'active_vehicles', label: 'Active Vehicles', count: activeVehicles.length },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            
            const [pDrivers, pVehicles, aDrivers, bDrivers, aVehicles] = await Promise.all([
                axios.get('/api/admin/verify/drivers', config),
                axios.get('/api/admin/verify/vehicles', config),
                axios.get('/api/admin/users?role=DRIVER&status=APPROVED', config),
                axios.get('/api/admin/users?role=DRIVER&status=BLOCKED', config),
                axios.get('/api/admin/vehicles?status=AVAILABLE', config) 
            ]);

            setPendingDrivers(pDrivers.data);
            setPendingVehicles(pVehicles.data);
            setActiveDrivers(aDrivers.data);
            setBlockedDrivers(bDrivers.data);
            setActiveVehicles(aVehicles.data);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper filtering function
    const filterDrivers = (list) => {
        if (!searchTerm) return list;
        return list.filter(d => 
            d.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
            d.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleVerifyUser = (id, status) => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        axios.post(`/api/admin/user/${id}/verify?status=${status}`, {}, config)
            .then(() => {
                fetchData(); // Refresh all lists as an item might move between them
            })
            .catch(err => alert("Error processing request"));
    };

    const handleVerifyVehicle = (id, status) => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        axios.post(`/api/admin/vehicle/${id}/verify?status=${status}`, {}, config)
            .then(() => {
                fetchData();
            })
            .catch(err => alert("Error processing request"));
    };

    const getDocUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://localhost:8080${path}`;
    };

    const renderPendingDrivers = () => (
        <div className="space-y-4">
            {pendingDrivers.length === 0 && <p className="text-slate-400">No pending driver approvals.</p>}
            {pendingDrivers.map(driver => (
                <div key={driver.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex items-start gap-5 flex-wrap">

                        {/* Profile Photo */}
                        <div className="shrink-0">
                            {driver.profileImage ? (
                                <a href={getDocUrl(driver.profileImage)} target="_blank" rel="noreferrer" title="Click to view full photo">
                                    <img
                                        src={getDocUrl(driver.profileImage)}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-xl object-cover border-2 border-slate-600 hover:border-blue-400 transition cursor-pointer"
                                    />
                                </a>
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    {driver.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Driver Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                                <h3 className="text-xl font-bold text-white">{driver.username}</h3>
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                                    Pending Verification
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-400 mb-4">
                                <span>📧 Email: <span className="text-white">{driver.email}</span></span>
                                <span>📱 Mobile: <span className="text-white">{driver.mobileNumber || '—'}</span></span>
                                <span>🪪 Aadhaar: <span className="text-white">
                                    {driver.aadhaarNumber
                                        ? `XXXX-XXXX-${driver.aadhaarNumber.toString().slice(-4)}`
                                        : '—'}
                                </span></span>
                                <span>🆔 Driver ID: <span className="text-white">#{driver.id}</span></span>
                            </div>

                            {/* Documents */}
                            <div className="flex flex-wrap gap-3">
                                {driver.drivingLicense ? (
                                    <a href={getDocUrl(driver.drivingLicense)}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        📄 View Driving License
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-400 text-xs rounded-lg">
                                        ⚠️ No License uploaded
                                    </span>
                                )}
                                {driver.profileImage && (
                                    <a href={getDocUrl(driver.profileImage)}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        🖼️ View Profile Photo
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => handleVerifyUser(driver.id, 'APPROVED')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium transition whitespace-nowrap">
                                ✅ Approve Driver
                            </button>
                            <button onClick={() => handleVerifyUser(driver.id, 'REJECTED')}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-medium transition whitespace-nowrap">
                                ❌ Reject Driver
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPendingVehicles = () => (
        <div className="space-y-4">
            {pendingVehicles.length === 0 && <p className="text-slate-400">No pending vehicle approvals.</p>}
            {pendingVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                                <h3 className="text-xl font-bold text-white">{vehicle.vehicleNumber}</h3>
                                <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                                    {vehicle.type}
                                </span>
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                                    Pending Approval
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-400 mb-4">
                                {vehicle.driver && (
                                    <span>👤 Driver: <span className="text-white">{vehicle.driver.username || `ID:${vehicle.driver.id}`}</span></span>
                                )}
                                <span>🪑 Seats: <span className="text-white">{vehicle.seatCount || '—'}</span></span>
                                <span>⛽ Fuel: <span className="text-white">{vehicle.fuelLevel ?? '—'}%</span></span>
                                <span>📍 KMs: <span className="text-white">{vehicle.kmsDriven?.toLocaleString() || '—'}</span></span>
                            </div>

                            {/* Documents */}
                            <div className="flex flex-wrap gap-3">
                                {vehicle.rcPdfUrl ? (
                                    <a href={`http://localhost:8080${vehicle.rcPdfUrl}`}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        📄 View RC Document
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-400 text-xs rounded-lg">
                                        ⚠️ No RC uploaded
                                    </span>
                                )}
                                {vehicle.insurancePdfUrl ? (
                                    <a href={`http://localhost:8080${vehicle.insurancePdfUrl}`}
                                        target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition"
                                    >
                                        🛡️ View Insurance Doc
                                    </a>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 text-slate-400 text-xs rounded-lg">
                                        ⚠️ No Insurance uploaded
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            <button onClick={() => handleVerifyVehicle(vehicle.id, 'AVAILABLE')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap">
                                ✅ Approve Vehicle
                            </button>
                            <button onClick={() => handleVerifyVehicle(vehicle.id, 'REJECTED')}
                                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg font-medium transition flex items-center gap-2 whitespace-nowrap">
                                ❌ Reject Vehicle
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderActiveDrivers = () => {
        const filtered = filterDrivers(activeDrivers);
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(driver => (
                    <div key={driver.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 relative group">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-xl font-bold">
                                {driver.username.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-white">{driver.username}</h3>
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Active</span>
                             </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">📧 {driver.email}</p>
                        <p className="text-slate-400 text-sm">📱 {driver.mobileNumber}</p>
                         <p className="text-slate-400 text-sm mt-2">⭐ {driver.averageRating || 'N/A'} ({driver.ratingCount || 0} reviews)</p>
                         
                         <div className="mt-4 pt-4 border-t border-slate-700">
                            <button 
                                onClick={() => handleVerifyUser(driver.id, 'BLOCKED')}
                                className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition text-sm font-medium"
                            >
                                Block Driver
                            </button>
                         </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-slate-400 col-span-full">No active drivers match your search.</p>}
            </div>
        );
    };

    const renderBlockedDrivers = () => {
         const filtered = filterDrivers(blockedDrivers);
         return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.length === 0 && <p className="text-slate-400 col-span-full">No blocked drivers match your search.</p>}
                {filtered.map(driver => (
                    <div key={driver.id} className="bg-slate-800 p-6 rounded-lg border border-red-900/50 opacity-75 hover:opacity-100 transition">
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xl font-bold">
                                {driver.username.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-white">{driver.username}</h3>
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Blocked</span>
                             </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">📧 {driver.email}</p>
                        <p className="text-slate-400 text-sm">📱 {driver.mobileNumber}</p>
                         
                         <div className="mt-4 pt-4 border-t border-slate-700">
                            <button 
                                onClick={() => handleVerifyUser(driver.id, 'APPROVED')}
                                className="w-full py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition text-sm font-medium"
                            >
                                Unblock Driver
                            </button>
                         </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderActiveVehicles = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeVehicles.map(vehicle => (
                 <div key={vehicle.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h3 className="font-bold text-white text-lg mb-2">{vehicle.vehicleNumber}</h3>
                    <p className="text-slate-400 text-sm">Model: {vehicle.vehicleModel}</p>
                    <p className="text-slate-400 text-sm">Type: {vehicle.type}</p>
                    <p className="text-slate-400 text-sm">Seats: {vehicle.seatCount}</p>
                    <div className="mt-4 flex gap-2">
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Fuel: {vehicle.fuelLevel}%</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Km: {vehicle.kilometersDriven}</span>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="text-white max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Driver & Vehicle Management</h1>
                
                {/* Search Input - Conditional Display */}
                {(activeTab === 'active_drivers' || activeTab === 'blocked_drivers') && (
                    <input 
                        type="text" 
                        placeholder="Search drivers..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64"
                    />
                )}
            </div>
            
            {/* Tabs Header */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 mb-8 pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 font-medium transition-all rounded-t-lg flex items-center gap-2 ${
                            activeTab === tab.id
                                ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'pending_drivers' && renderPendingDrivers()}
                        {activeTab === 'pending_vehicles' && renderPendingVehicles()}
                        {activeTab === 'active_drivers' && renderActiveDrivers()}
                        {activeTab === 'blocked_drivers' && renderBlockedDrivers()}
                        {activeTab === 'active_vehicles' && renderActiveVehicles()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDriverPage;
