import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminCustomerPage = () => {
    const [activeTab, setActiveTab] = useState('customers');
    const [customers, setCustomers] = useState([]);
    const [blockedCustomers, setBlockedCustomers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'customers', label: 'All Customers', count: customers.length },
        { id: 'blocked_customers', label: 'Blocked Customers', count: blockedCustomers.length },
        { id: 'bookings', label: 'All Bookings', count: bookings.length },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            
            const [, , bookingsRes] = await Promise.all([
                 axios.get('/api/admin/users?role=CUSTOMER&status=APPROVED', config), 
                 axios.get('/api/admin/users?role=CUSTOMER&status=BLOCKED', config),
                 axios.get('/api/bookings/all', config)
            ]);
            
             const allCustomersRes = await axios.get('/api/admin/users?role=CUSTOMER', config);
             const all = allCustomersRes.data;
             
             setCustomers(all.filter(u => u.verificationStatus !== 'BLOCKED'));
             setBlockedCustomers(all.filter(u => u.verificationStatus === 'BLOCKED'));
             setBookings(bookingsRes.data);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterCustomers = (list) => {
        if (!searchTerm) return list;
        return list.filter(u => 
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const filterBookings = (list) => {
        if (!searchTerm) return list;
        return list.filter(b => 
            b.pickupLoc.toLowerCase().includes(searchTerm.toLowerCase()) || 
            b.dropoffLoc.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const handleVerifyUser = (id, status) => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        axios.post(`/api/admin/user/${id}/verify?status=${status}`, {}, config)
            .then(() => {
                fetchData();
            })
            .catch(err => alert("Error processing request"));
    };

    const renderCustomers = () => {
        const filtered = filterCustomers(customers);
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(user => (
                    <div key={user.id} className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-purple-500/30 transition-colors group">
                        {/* Customer Card Content */}
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xl font-bold">
                                {user.username.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-white">{user.username}</h3>
                                <span className="text-xs text-slate-500">Member since {new Date().getFullYear()}</span>
                             </div>
                        </div>
                        <div className="space-y-2 text-sm">
                             <p className="text-slate-400 flex items-center gap-2">📧 {user.email}</p>
                             <p className="text-slate-400 flex items-center gap-2">📱 {user.mobileNumber || 'No number'}</p>
                             <div className="pt-3 flex gap-2">
                                 <span className={`px-2 py-1 rounded text-xs ${user.verificationStatus === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                     {user.verificationStatus}
                                 </span>
                             </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-700">
                             <button 
                                 onClick={() => handleVerifyUser(user.id, 'BLOCKED')}
                                 className="w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition text-sm font-medium"
                             >
                                 Block Customer
                             </button>
                          </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-slate-400 col-span-full">No active customers match your search.</p>}
            </div>
        );
    };

    const renderBlockedCustomers = () => {
         const filtered = filterCustomers(blockedCustomers);
         return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(user => (
                    <div key={user.id} className="bg-slate-800 p-6 rounded-lg border border-red-900/50 opacity-75 hover:opacity-100 transition">
                         {/* Blocked Customer Card Content */}
                        <div className="flex items-center gap-4 mb-4">
                             <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xl font-bold">
                                {user.username.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <h3 className="font-bold text-white">{user.username}</h3>
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Blocked</span>
                             </div>
                        </div>
                        <div className="space-y-2 text-sm">
                             <p className="text-slate-400 flex items-center gap-2">📧 {user.email}</p>
                             <div className="mt-4 pt-4 border-t border-slate-700">
                                 <button 
                                     onClick={() => handleVerifyUser(user.id, 'APPROVED')}
                                     className="w-full py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded transition text-sm font-medium"
                                 >
                                     Unblock Customer
                                 </button>
                             </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-slate-400 col-span-full">No blocked customers match your search.</p>}
            </div>
        );
    };

    const renderBookings = () => {
        const filtered = filterBookings(bookings);
        return (
             <div className="space-y-4">
                  {filtered.map(booking => (
                     <div key={booking.id} className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between gap-4">
                         {/* Booking Card Content */}
                         <div>
                             <div className="flex items-center gap-3 mb-2">
                                  <span className="font-bold text-white">Booking #{booking.id}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${booking.status === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                                     {booking.status}
                                  </span>
                             </div>
                             <p className="text-slate-300 text-sm mb-1">
                                 <span className="text-purple-400">{booking.pickupLoc}</span> ➔ <span className="text-purple-400">{booking.dropoffLoc}</span>
                             </p>
                              <p className="text-slate-500 text-xs">
                                 Date: {new Date(booking.bookingTime).toLocaleString()}
                             </p>
                         </div>
                         
                         <div className="flex flex-col md:items-end justify-center text-sm">
                             <p className="text-slate-300">Customer: <span className="text-white font-medium">{booking.customer?.username}</span></p>
                             <p className="text-slate-300">Fare: <span className="text-emerald-400 font-bold">₹{booking.fare}</span></p>
                         </div>
                     </div>
                  ))}
                  {filtered.length === 0 && <p className="text-slate-400">No bookings match your search.</p>}
             </div>
        );
    };

    return (
        <div className="text-white max-w-6xl mx-auto">
             <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Customer Management</h1>
                
                <input 
                    type="text" 
                    placeholder={activeTab === 'bookings' ? "Search location..." : "Search customers..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 w-64"
                />
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

             <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'customers' && renderCustomers()}
                        {activeTab === 'blocked_customers' && renderBlockedCustomers()}
                        {activeTab === 'bookings' && renderBookings()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminCustomerPage;
