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

    const renderPendingDrivers = () => (
        <div className="space-y-4">
            {pendingDrivers.length === 0 && <p className="text-slate-400">No pending driver approvals.</p>}
            {pendingDrivers.map(driver => (
                <div key={driver.id} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start border border-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-white">{driver.username}</h3>
                        <p className="text-slate-400">{driver.email}</p>
                        <p className="text-slate-400">Phone: {driver.mobileNumber}</p>
                        {driver.drivingLicense && (
                            <a href={driver.drivingLicense} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline mt-2 inline-block">View License</a>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleVerifyUser(driver.id, 'APPROVED')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition">Approve</button>
                        <button onClick={() => handleVerifyUser(driver.id, 'REJECTED')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition">Reject</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPendingVehicles = () => (
        <div className="space-y-4">
            {pendingVehicles.length === 0 && <p className="text-slate-400">No pending vehicle approvals.</p>}
            {pendingVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-slate-800 p-6 rounded-lg flex justify-between items-start border border-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-white">{vehicle.vehicleNumber}</h3>
                         <p className="text-slate-400">Model: {vehicle.vehicleModel} ({vehicle.type})</p>
                        <p className="text-slate-400">Owner ID: {vehicle.driverId}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                             {vehicle.rcDocument && <a href={vehicle.rcDocument} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">RC Doc</a>}
                             {vehicle.insuranceDocument && <a href={vehicle.insuranceDocument} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Insurance</a>}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => handleVerifyVehicle(vehicle.id, 'AVAILABLE')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition">Approve</button>
                        <button onClick={() => handleVerifyVehicle(vehicle.id, 'REJECTED')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-medium transition">Reject</button>
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
