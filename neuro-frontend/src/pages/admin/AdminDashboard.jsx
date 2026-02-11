import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { LayoutDashboard, Car, Users, MessageSquare, Wrench, Search, Phone, Mail, MapPin, FileText } from 'lucide-react';
import AdminReportsPage from './AdminReportsPage';

const AdminDashboard = () => {
    const [activeSection, setActiveSection] = useState('overview');
    
    // Data States
    const [stats, setStats] = useState({ drivers: 0, customers: 0, trips: 0, revenue: 0 });
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [pendingVehicles, setPendingVehicles] = useState([]);
    const [trips, setTrips] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]); // All users for 'Users' tab
    const [vehicles, setVehicles] = useState([]); // All vehicles for 'Vehicles' tab

    // Contact Modal
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [selectedContactUser, setSelectedContactUser] = useState(null);
    const [messageText, setMessageText] = useState("");

    useEffect(() => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        
        // Parallel data fetching
        const fetchData = async () => {
            try {
                const [dRes, vRes, tRes, bRes, rRes, uRes, allVRes] = await Promise.all([
                    axios.get('/api/admin/verify/drivers', config),
                    axios.get('/api/admin/verify/vehicles', config),
                    axios.get('/api/trips/all', config),
                    axios.get('/api/bookings/all', config),
                    axios.get('/api/reviews/all', config),
                    axios.get('/api/admin/users/all', config).catch(() => ({data: []})), // Assuming endpoint or mock
                    axios.get('/api/driver/1/vehicles') // Mocking "All Vehicles" endpoint for now by just fetching one driver's, ideally need /api/admin/vehicles/all
                ]);

                setPendingDrivers(dRes.data);
                setPendingVehicles(vRes.data);
                setTrips(tRes.data);
                setBookings(bRes.data);
                setReviews(rRes.data);
                // setUsers(uRes.data); // Need to create this endpoint or user existing
                // setVehicles(allVRes.data);
            } catch(e) { console.error(e); }
        };
        fetchData();
    }, []);

    const handleVerify = async (type, id, status) => {
         try {
             await axios.post(`/api/admin/${type}/${id}/verify?status=${status}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
             alert("Success");
             if(type === 'user') setPendingDrivers(prev => prev.filter(p => p.id !== id));
             if(type === 'vehicle') setPendingVehicles(prev => prev.filter(p => p.id !== id));
         } catch(e) { alert("Error verifying"); }
    };

    const handleSendMessage = async () => {
        if(!selectedContactUser) return;
        try {
            // Mock Admin ID = 1 (or get from context)
            await axios.post('/api/messages/send', {
                senderId: 1, 
                receiverId: selectedContactUser.id,
                content: messageText
            });
            alert("Message Sent!");
            setContactModalOpen(false);
            setMessageText("");
        } catch(e) { alert("Failed to send"); }
    };

    // --- SUB-PAGES ---

    const renderOverview = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            {/* Pending Approvals */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-amber-500" /> Pending Approvals
                </h3>
                {pendingDrivers.length === 0 && pendingVehicles.length === 0 ? (
                    <div className="p-8 bg-slate-900/50 rounded-xl border border-slate-800 text-center text-slate-500">
                        Everything is up to date!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingDrivers.map(d => (
                             <div key={d.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{d.username} <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Driver</span></p>
                                    <p className="text-xs text-slate-400">{d.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVerify('user', d.id, 'APPROVED')} className="px-3 py-1 bg-emerald-600 rounded text-xs font-bold hover:bg-emerald-500">Accept</button>
                                    <button onClick={() => handleVerify('user', d.id, 'REJECTED')} className="px-3 py-1 bg-red-600/20 text-red-500 rounded text-xs font-bold hover:bg-red-600/30">Reject</button>
                                </div>
                             </div>
                        ))}
                        {pendingVehicles.map(v => (
                             <div key={v.id} className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{v.vehicleNumber} <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">Vehicle</span></p>
                                    <p className="text-xs text-slate-400">{v.type}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleVerify('vehicle', v.id, 'APPROVED')} className="px-3 py-1 bg-emerald-600 rounded text-xs font-bold hover:bg-emerald-500">Accept</button>
                                    <button onClick={() => handleVerify('vehicle', v.id, 'REJECTED')} className="px-3 py-1 bg-red-600/20 text-red-500 rounded text-xs font-bold hover:bg-red-600/30">Reject</button>
                                </div>
                             </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Live Stats */}
            <div className="glass-panel p-6 rounded-xl">
                 <h3 className="text-xl font-bold text-white mb-6">System Pulse</h3>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-800/50 p-4 rounded-lg">
                         <p className="text-slate-500 text-xs uppercase">Recent Bookings</p>
                         <p className="text-2xl font-bold text-white">{bookings.length}</p>
                     </div>
                     <div className="bg-slate-800/50 p-4 rounded-lg">
                         <p className="text-slate-500 text-xs uppercase">Active Trips</p>
                         <p className="text-2xl font-bold text-white">{trips.length}</p>
                     </div>
                 </div>
            </div>
        </div>
    );

    const renderVehicles = () => (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Vehicles & Maintenance</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" placeholder="Search vehicle..." className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                </div>
             </div>
             {/* Mock List of Vehicles with Status */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder Items */}
                {[1,2,3].map(i => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-slate-800 p-3 rounded-lg"><Car className="w-6 h-6 text-blue-400" /></div>
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded">Active</span>
                        </div>
                        <h4 className="font-bold text-lg text-white">KA-01-MJ-202{i}</h4>
                        <p className="text-sm text-slate-400 mb-4">Sedan • Joined Jan 2024</p>
                        
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                             <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Electronic City</span>
                             <span className="text-xs text-amber-500 flex items-center gap-1"><Wrench className="w-3 h-3" /> Service Due</span>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );

    const renderFeedback = () => (
        <div className="animate-fade-in">
             <h2 className="text-2xl font-bold text-white mb-6">Customer Feedbacks</h2>
             <div className="grid grid-cols-1 gap-4">
                {reviews.map(r => (
                    <div key={r.id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-xl flex gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-purple-600/20 text-purple-400 rounded-full flex items-center justify-center font-bold text-lg">
                                {r.customer?.username?.[0] || 'U'}
                            </div>
                        </div>
                        <div className="flex-grow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{r.customer?.username || 'Customer'} <span className="text-slate-500 font-normal text-sm">reviewed</span> {r.driver?.username || 'Driver'}</h4>
                                    <div className="flex text-yellow-500 text-sm mt-1">
                                        {'★'.repeat(r.rating)}<span className="text-slate-700">{'★'.repeat(5 - r.rating)}</span>
                                    </div>
                                </div>
                                <span className="text-slate-500 text-sm">{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-3 text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800/50">"{r.feedback}"</p>
                        </div>
                    </div>
                ))}
             </div>
        </div>
    );

    const renderUsers = () => (
         <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">User Management</h2>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold">Drivers</button>
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold">Customers</button>
                </div>
             </div>
             
             <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {/* Mock Users for Demo */}
                        {[
                            {id: 101, username: 'Rajesh Kumar', role: 'DRIVER', status: 'ACTIVE'},
                            {id: 102, username: 'Sneha Reddy', role: 'CUSTOMER', status: 'ACTIVE'},
                            {id: 103, username: 'John Doe', role: 'DRIVER', status: 'BLOCKED'}
                        ].map(u => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-bold text-white">{u.username}</td>
                                <td className="p-4 text-sm text-slate-400">{u.role}</td>
                                <td className="p-4"><span className={`text-xs px-2 py-1 rounded font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{u.status}</span></td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => { setSelectedContactUser(u); setContactModalOpen(true); }}
                                        className="text-blue-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-1 ml-auto w-fit"
                                    >
                                        <MessageSquare className="w-3 h-3" /> Contact
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
         </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white flex font-sans">
             {/* SIDEBAR */}
             <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-40">
                 <div className="p-6 border-b border-slate-800">
                     <h1 className="text-xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Administrator</h1>
                 </div>
                 <nav className="flex-1 p-4 space-y-2">
                     <SidebarItem icon={<LayoutDashboard />} label="Overview" active={activeSection === 'overview'} onClick={() => setActiveSection('overview')} />
                     <SidebarItem icon={<Car />} label="Vehicles" active={activeSection === 'vehicles'} onClick={() => setActiveSection('vehicles')} />
                     <SidebarItem icon={<Users />} label="Users" active={activeSection === 'users'} onClick={() => setActiveSection('users')} />
                     <SidebarItem icon={<MessageSquare />} label="Feedbacks" active={activeSection === 'feedback'} onClick={() => setActiveSection('feedback')} />
                     <SidebarItem icon={<FileText />} label="Reports" active={activeSection === 'reports'} onClick={() => setActiveSection('reports')} />
                 </nav>
                 <div className="p-4 border-t border-slate-800">
                     <button onClick={() => window.location.href='/login'} className="w-full py-2 bg-slate-800 text-red-400 text-sm font-bold rounded-lg hover:bg-slate-700">Logout</button>
                 </div>
             </div>

             {/* MAIN CONTENT */}
             <div className="flex-1 ml-64">
                <Navbar /> {/* Top Navbar mostly for profile/global navigation */}
                <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto">
                    {activeSection === 'overview' && renderOverview()}
                    {activeSection === 'vehicles' && renderVehicles()}
                    {activeSection === 'users' && renderUsers()}
                    {activeSection === 'feedback' && renderFeedback()}
                    {activeSection === 'reports' && <AdminReportsPage />}
                </div>
             </div>

             {/* CONTACT MODAL */}
             {contactModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button onClick={() => setContactModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                        <h3 className="text-lg font-bold text-white mb-2">Contact {selectedContactUser?.username}</h3>
                        <div className="flex gap-4 mb-6">
                            <a href={`tel:1234567890`} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors">
                                <Phone className="w-4 h-4 text-emerald-400" /> Call
                            </a>
                            <a href={`mailto:user@example.com`} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-colors">
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

// Helper Icon
const UserPlus = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
);

export default AdminDashboard;
