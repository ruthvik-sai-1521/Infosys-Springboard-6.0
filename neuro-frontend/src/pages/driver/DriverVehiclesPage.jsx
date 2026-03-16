import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { MapPin, Battery, Droplet, Gauge, PenTool, ArrowLeft, PlusCircle, Activity, X, AlertOctagon, Wrench, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LiveMap } from '../../components/maps';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import DriverVehicleHealthModal from './DriverVehicleHealthModal';

const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946
};

// Simple Toast Component for Alerts
const AlertToast = ({ alert, onClose }) => (
    <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl animate-fade-in flex gap-3 max-w-sm relative">
        <div className={`p-2 rounded-lg h-fit ${alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
            <Activity className="w-5 h-5" />
        </div>
        <div>
            <h4 className="font-bold text-white text-sm">{alert.title}</h4>
            <p className="text-slate-400 text-xs mt-1">{alert.description}</p>
            <p className="text-slate-500 text-[10px] mt-2">{new Date().toLocaleTimeString()}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white h-fit absolute top-2 right-2"><X className="w-4 h-4" /></button>
    </div>
);

const DriverVehiclesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    
    // Health & Alerts
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [selectedHealthVehicle, setSelectedHealthVehicle] = useState(null);
    const [toasts, setToasts] = useState([]);

    // Maintenance Submission
    const [maintenanceModal, setMaintenanceModal] = useState(null); // vehicle object
    const [maintForm, setMaintForm] = useState({ maintenanceDate: '', description: '' });
    const [submittingMaint, setSubmittingMaint] = useState(false);
    const [vehicleSubmissions, setVehicleSubmissions] = useState({}); // vehicleId -> latest submission

    // WebSocket
    const stompClientRef = useRef(null);

    // Form Stats
    const [vehicleForm, setVehicleForm] = useState({
        vehicleNumber: '', type: 'SEDAN', seatCount: 3, fuelLevel: 100, kmsDriven: 0,
        mileage: 0, fuelCapacity: 0
    });
    const [rcFile, setRcFile] = useState(null);
    const [insuranceFile, setInsuranceFile] = useState(null);

    const driverId = user?.id; 

    const fetchVehicles = useCallback(async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const res = await axios.get(`/api/driver/${driverId}/vehicles`, config);
            setVehicles(res.data);
            if (res.data.length === 0) setFormVisible(true);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [driverId]);

    const fetchAlerts = useCallback(async () => {
        if (!driverId) return;
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const res = await axios.get(`/api/health/alerts/driver/${driverId}`, config);
            setActiveAlerts(res.data);
        } catch(e) { console.error("Error fetching alerts", e); }
    }, [driverId]);

    const fetchDriverSubmissions = useCallback(async () => {
        if (!driverId) return;
        try {
            const res = await axios.get(`/api/maintenance/my-submissions?driverId=${driverId}`);
            // Only track PENDING submissions — APPROVED/REJECTED ones should not show the banner
            const map = {};
            res.data
                .filter(s => s.status === 'PENDING')
                .forEach(s => {
                    const vid = s.vehicle?.id;
                    if (vid && (!map[vid] || new Date(s.submissionDate) > new Date(map[vid].submissionDate))) {
                        map[vid] = s;
                    }
                });
            setVehicleSubmissions(map);
        } catch (e) { console.error('Failed to fetch submissions', e); }
    }, [driverId]);

    const refreshAll = useCallback(async () => {
        await Promise.all([fetchVehicles(), fetchAlerts(), fetchDriverSubmissions()]);
    }, [fetchVehicles, fetchAlerts, fetchDriverSubmissions]);

    // Poll every 5s when any vehicle is in a blocked state, so we catch manager approval quickly
    const pollRef = useRef(null);
    const startPolling = useCallback(() => {
        if (pollRef.current) return; // already polling
        pollRef.current = setInterval(() => {
            refreshAll();
        }, 5000);
    }, [refreshAll]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    // Start/stop polling based on whether any vehicle is blocked
    useEffect(() => {
        const anyBlocked = vehicles.some(v =>
            v.holdStatus === 'ON_HOLD' || v.holdStatus === 'PENDING_RELEASE'
        );
        if (anyBlocked) {
            startPolling();
        } else {
            stopPolling();
        }
        return () => {};
    }, [vehicles, startPolling, stopPolling]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (driverId) {
            fetchVehicles();
            fetchAlerts();
            fetchDriverSubmissions();
            connectWebSocket();
        } else {
             setLoading(false);
        }

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
            stopPolling();
        };
    }, [driverId]); // intentional: connectWebSocket is stable for session

    const connectWebSocket = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                // Subscribe to Driver Health Alerts
                client.subscribe(`/topic/alerts/driver/${driverId}`, (message) => {
                    const alert = JSON.parse(message.body);
                    handleNewAlert(alert);
                });
                // Subscribe to maintenance submission review results
                client.subscribe(`/topic/notifications/driver/${driverId}`, (message) => {
                    const notif = JSON.parse(message.body);
                    handleMaintenanceReviewNotif(notif);
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        stompClientRef.current = client;
    };

    const handleMaintenanceReviewNotif = (notif) => {
        const approved = notif.approved;
        const toastObj = {
            id: Date.now(),
            title: approved ? '✅ Vehicle Released!' : '❌ Submission Rejected',
            description: notif.message || (approved
                ? `Vehicle ${notif.vehicleNumber} has been approved and released for trips.`
                : `Your maintenance submission for ${notif.vehicleNumber} was rejected.`),
            severity: approved ? 'INFO' : 'HIGH'
        };
        setToasts(prev => [...prev, toastObj]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastObj.id)), 7000);
        // Refresh vehicles and submissions so hold status updates
        fetchVehicles();
        fetchDriverSubmissions();
    };

    const handleNewAlert = (alert) => {
        // Add to active alerts list
        setActiveAlerts(prev => [alert, ...prev]);
        
        // Show Toast
        const id = Date.now();
        setToasts(prev => [...prev, { ...alert, id }]);
        
        // Auto remove toast after 5s
        setTimeout(() => {
             setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);

        // Refresh vehicles to update status if needed
        fetchVehicles();
        fetchDriverSubmissions();
    };

    const handleTypeChange = (e) => {
        const type = e.target.value;
        let seats = 5; // Default
        if (type === 'SUV') seats = 7;
        else if (type === 'SEDAN' || type === 'HATCHBACK' || type === 'EV') seats = 5;
        
        setVehicleForm({ ...vehicleForm, type, seatCount: seats });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!driverId) { alert('User not authenticated properly. Please reload.'); return; }
        if (!rcFile) { alert('Please upload the RC Document (PDF or image).'); return; }
        if (!insuranceFile) { alert('Please upload the Insurance Document (PDF or image).'); return; }
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            const formData = new FormData();
            formData.append('vehicleNumber', vehicleForm.vehicleNumber);
            formData.append('type', vehicleForm.type);
            formData.append('seatCount', vehicleForm.seatCount);
            formData.append('fuelLevel', vehicleForm.fuelLevel);
            formData.append('kmsDriven', vehicleForm.kmsDriven);
            formData.append('mileage', vehicleForm.mileage);
            formData.append('fuelCapacity', vehicleForm.fuelCapacity);
            formData.append('rcFile', rcFile);
            formData.append('insuranceFile', insuranceFile);

            await axios.post(`/api/driver/${driverId}/vehicle/add`, formData, config);
            alert('Vehicle Submitted for Approval!');
            setFormVisible(false);
            fetchVehicles();
            setVehicleForm({ vehicleNumber: '', type: 'SEDAN', seatCount: 3, fuelLevel: 100, kmsDriven: 0, mileage: 0, fuelCapacity: 0 });
            setRcFile(null);
            setInsuranceFile(null);
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message));
        }
    };

    // ── Maintenance submission handler ─────────────────────────────────
    const openMaintenanceModal = (vehicle) => {
        setMaintenanceModal(vehicle);
        setMaintForm({ maintenanceDate: new Date().toISOString().split('T')[0], description: '' });
    };

    const submitMaintenanceForm = async () => {
        if (!maintForm.maintenanceDate) { alert('Please enter the maintenance date.'); return; }
        if (!maintForm.description.trim()) { alert('Please describe the maintenance work done.'); return; }
        setSubmittingMaint(true);
        try {
            const formData = new FormData();
            formData.append('vehicleId', maintenanceModal.id);
            formData.append('driverId', driverId);
            formData.append('maintenanceDate', maintForm.maintenanceDate);
            formData.append('description', maintForm.description);
            await axios.post('/api/maintenance/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Maintenance details submitted! Awaiting manager review.');
            setMaintenanceModal(null);
            fetchVehicles();
            fetchDriverSubmissions();
        } catch (e) {
            alert('Failed to submit: ' + (e.response?.data?.error || e.message));
        }
        setSubmittingMaint(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
             <Navbar />
             
             {/* Toasts Container */}
             <div className="fixed top-24 right-6 z-[1000] flex flex-col gap-2 pointer-events-none">
                 <div className="pointer-events-auto flex flex-col gap-2">
                     {toasts.map(t => (
                         <AlertToast key={t.id} alert={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
                     ))}
                 </div>
             </div>

             <div className="pt-24 max-w-7xl mx-auto px-6 animate-fade-in">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <button 
                            onClick={() => navigate('/driver')}
                            className="flex items-center text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-bold text-white">My Fleet</h1>
                        <p className="text-slate-400 text-sm mt-1">Manage vehicles, track fuel & health</p>
                    </div>

                    <button 
                        onClick={() => setFormVisible(!formVisible)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all ${
                            formVisible 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                    >
                        {formVisible ? 'Cancel' : <><PlusCircle className="w-5 h-5" /> Add Vehicle</>}
                    </button>
                </div>

                {/* ADD VEHICLE FORM */}
                {formVisible && (
                    <div className="glass-panel p-8 rounded-2xl mb-12 border border-slate-700 animate-slide-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <PlusCircle className="w-6 h-6 text-emerald-500" /> Register New Vehicle
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm text-slate-400 mb-1">Vehicle Join Number</label>
                                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:border-emerald-500 outline-none text-white font-mono" 
                                    required placeholder="e.g. KA-01-AB-1234"
                                    value={vehicleForm.vehicleNumber}
                                    onChange={e => setVehicleForm({...vehicleForm, vehicleNumber: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm text-slate-400 mb-1">Type</label>
                                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white"
                                        value={vehicleForm.type} onChange={handleTypeChange}>
                                        <option value="SEDAN">Sedan</option>
                                        <option value="SUV">SUV</option>
                                        <option value="HATCHBACK">Hatchback</option>
                                        <option value="EV">EV</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Seats</label>
                                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" 
                                        min="1" max="60"
                                        required
                                        value={vehicleForm.seatCount}
                                        onChange={e => setVehicleForm({...vehicleForm, seatCount: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            
                            <div>
                                 <label className="block text-sm text-slate-400 mb-1">Current Odometer (KM)</label>
                                 <div className="relative">
                                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white" 
                                        required
                                        value={vehicleForm.kmsDriven}
                                        onChange={e => setVehicleForm({...vehicleForm, kmsDriven: parseInt(e.target.value)})} />
                                 </div>
                            </div>

                             <div>
                                 <label className="block text-sm text-slate-400 mb-1">Fuel / Charge Level (%)</label>
                                 <div className="relative">
                                    <Droplet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                     <input type="number" min="0" max="100" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white" 
                                        value={vehicleForm.fuelLevel}
                                        onChange={e => setVehicleForm({...vehicleForm, fuelLevel: parseInt(e.target.value)})} />
                                 </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Mileage (km/l)</label>
                                    <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" required placeholder="e.g 18.5"
                                        value={vehicleForm.mileage || ''}
                                        onChange={e => setVehicleForm({...vehicleForm, mileage: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Tank Capacity (L)</label>
                                    <input type="number" step="0.1" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" required placeholder="e.g 45"
                                        value={vehicleForm.fuelCapacity || ''}
                                        onChange={e => setVehicleForm({...vehicleForm, fuelCapacity: parseFloat(e.target.value)})} />
                                </div>
                            </div>

                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* RC Document Upload */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">
                                        RC Document <span className="text-red-400">*</span>
                                        <span className="text-slate-500 ml-1">(PDF/JPG/PNG, max 10MB)</span>
                                    </label>
                                    <label className={`flex items-center gap-3 w-full border rounded-lg p-3 cursor-pointer transition-all ${
                                        rcFile ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                                    }`}>
                                        <span className="text-2xl">{rcFile ? '📄' : '📁'}</span>
                                        <span className={`text-sm truncate flex-1 ${rcFile ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {rcFile ? rcFile.name : 'Click to upload RC Document'}
                                        </span>
                                        {rcFile && (
                                            <button type="button" onClick={(ev) => { ev.preventDefault(); setRcFile(null); }}
                                                className="text-slate-500 hover:text-red-400 shrink-0 text-lg leading-none">
                                                ✕
                                            </button>
                                        )}
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                            onChange={e => setRcFile(e.target.files[0] || null)} />
                                    </label>
                                </div>
                                {/* Insurance Document Upload */}
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">
                                        Insurance Document <span className="text-red-400">*</span>
                                        <span className="text-slate-500 ml-1">(PDF/JPG/PNG, max 10MB)</span>
                                    </label>
                                    <label className={`flex items-center gap-3 w-full border rounded-lg p-3 cursor-pointer transition-all ${
                                        insuranceFile ? 'border-emerald-500 bg-emerald-900/10' : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                                    }`}>
                                        <span className="text-2xl">{insuranceFile ? '📄' : '📁'}</span>
                                        <span className={`text-sm truncate flex-1 ${insuranceFile ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {insuranceFile ? insuranceFile.name : 'Click to upload Insurance Document'}
                                        </span>
                                        {insuranceFile && (
                                            <button type="button" onClick={(ev) => { ev.preventDefault(); setInsuranceFile(null); }}
                                                className="text-slate-500 hover:text-red-400 shrink-0 text-lg leading-none">
                                                ✕
                                            </button>
                                        )}
                                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                                            onChange={e => setInsuranceFile(e.target.files[0] || null)} />
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/40">
                                    Submit Vehicle
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* VEHICLE LIST */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {loading ? <p className="text-slate-400">Loading fleet...</p> : 
                     vehicles.length === 0 && !formVisible ? 
                        <div className="col-span-full py-16 text-center bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-8 h-8 text-slate-500" />
                             </div>
                             <h3 className="text-xl font-bold text-white">No Vehicles Added</h3>
                             <p className="text-slate-400 mb-6">Add your first vehicle to start accepting trips.</p>
                             <button onClick={() => setFormVisible(true)} className="text-emerald-400 font-bold hover:underline">Add Now</button>
                        </div>
                     :
                     vehicles.map(v => (
                         <VehicleCard 
                             key={v.id} 
                             vehicle={v} 
                             refresh={fetchVehicles} 
                             alertCount={activeAlerts.filter(a => a.vehicleId === v.id || a.vehicle?.id === v.id).length}
                             onViewHealth={() => setSelectedHealthVehicle(v)}
                             onSubmitMaintenance={openMaintenanceModal}
                             latestSubmission={vehicleSubmissions[v.id]}
                         />
                      ))
                    }
                </div>
            </div>

            {/* Health Modal */}
            {selectedHealthVehicle && (
                <DriverVehicleHealthModal 
                    vehicle={selectedHealthVehicle} 
                    onClose={() => setSelectedHealthVehicle(null)} 
                    refreshData={() => { fetchVehicles(); fetchAlerts(); }}
                />
            )}

            {/* ── MAINTENANCE SUBMISSION MODAL ── */}
            {maintenanceModal && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-lg rounded-2xl border border-orange-500/40 shadow-2xl shadow-orange-900/20 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-900/40 to-red-900/30 p-5 border-b border-orange-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                                    <Wrench className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Submit Maintenance Report</h3>
                                    <p className="text-xs text-orange-300">{maintenanceModal.vehicleNumber} — Requesting Release from Hold</p>
                                </div>
                            </div>
                            <button onClick={() => setMaintenanceModal(null)} className="text-slate-400 hover:text-white p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-4 text-sm text-orange-200">
                                <AlertOctagon className="w-4 h-4 inline mr-2 text-orange-400" />
                                Fill out the maintenance details below. The fleet manager will review and release the vehicle when satisfied.
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Maintenance Date <span className="text-red-400">*</span></label>
                                <input
                                    type="date"
                                    value={maintForm.maintenanceDate}
                                    onChange={e => setMaintForm(f => ({ ...f, maintenanceDate: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1.5">Maintenance Description <span className="text-red-400">*</span></label>
                                <textarea
                                    rows={5}
                                    placeholder="Describe all maintenance work completed: e.g., Engine oil changed, brake pads replaced, tires inspected and inflated..."
                                    value={maintForm.description}
                                    onChange={e => setMaintForm(f => ({ ...f, description: e.target.value }))}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none resize-none text-sm"
                                />
                            </div>

                            <button
                                onClick={submitMaintenanceForm}
                                disabled={submittingMaint}
                                className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {submittingMaint
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                                    : <><CheckCircle2 className="w-4 h-4" /> Submit for Manager Review</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Extracted Component for cleaner logic per card
const VehicleCard = ({ vehicle, refresh, alertCount = 0, onViewHealth, onSubmitMaintenance, latestSubmission }) => {
    const [simulating, setSimulating] = useState(false);
    const [localVehicle, setLocalVehicle] = useState(vehicle);

    // ✔️ Sync localVehicle whenever parent fetches fresh data (e.g. after polling)
    useEffect(() => {
        setLocalVehicle(vehicle);
    }, [vehicle]);
    const [intervalId, setIntervalId] = useState(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    // Sync props & Parse Location
    useEffect(() => { 
        setLocalVehicle(vehicle); 
        if(vehicle.currentLocation) {
            const [lat, lng] = vehicle.currentLocation.split(',').map(Number);
            if(!isNaN(lat) && !isNaN(lng)) {
                setMapCenter({ lat, lng });
            }
        }
    }, [vehicle]);

    // Cleanup
    useEffect(() => {
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [intervalId]);

    const getHealthColor = (val) => (val === undefined || val === null ? 100 : val) > 50 ? 'text-emerald-500' : (val === undefined || val === null ? 100 : val) > 20 ? 'text-amber-500' : 'text-red-500';
    const getHealthColorBg = (val) => (val === undefined || val === null ? 100 : val) > 50 ? 'bg-emerald-500' : (val === undefined || val === null ? 100 : val) > 20 ? 'bg-amber-500' : 'bg-red-500';
    const getHealthStatusColor = (status) => {
        if(status === 'CRITICAL') return 'text-red-500';
        if(status === 'DUE' || status === 'WARNING') return 'text-amber-500';
        // Default to emerald for HEALTHY or null
        return 'text-emerald-500';
    };

    const toggleSimulation = async () => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        try {
            if (!simulating) {
                // START
                await axios.post(`/api/simulation/start-test-drive/${vehicle.id}`, {}, config);
                setSimulating(true);
                // Poll every 2s
                const id = setInterval(async () => {
                   try {
                       refresh(); 
                   } catch(e) { console.error(e); }
                }, 2000);
                setIntervalId(id);
            } else {
                // STOP
                await axios.post(`/api/simulation/stop/${vehicle.id}`, {}, config);
                setSimulating(false);
                if (intervalId) clearInterval(intervalId);
                refresh();
            }
        } catch (e) {
            console.error("Simulation error", e);
            alert("Simulation failed: " + (e.response?.data?.message || "Unknown error"));
            setSimulating(false);
            if (intervalId) clearInterval(intervalId);
        }
    };

    // isCritical: only if actually on hold (not ACTIVE or null/undefined)
    const isCritical = (localVehicle.holdStatus === 'ON_HOLD' || localVehicle.holdStatus === 'PENDING_RELEASE') &&
                       localVehicle.holdStatus !== 'ACTIVE';
    const isPendingRelease = localVehicle.holdStatus === 'PENDING_RELEASE';
    const isOnHold = localVehicle.holdStatus === 'ON_HOLD';

    return (
        <div className={`glass-card bg-slate-900/60 p-6 rounded-2xl border transition-all shadow-xl ${
            simulating ? 'border-emerald-500/50 shadow-emerald-500/10'
            : isOnHold ? 'border-red-500/60 shadow-red-900/20'
            : isPendingRelease ? 'border-orange-500/50 shadow-orange-900/20'
            : alertCount > 0 ? 'border-amber-500/30'
            : 'border-slate-800 hover:border-slate-600'}`}>

            {/* ── Critical / Hold Banner ── */}
            {isCritical && (
                <div className={`-mx-6 -mt-6 mb-5 px-5 py-3 rounded-t-2xl border-b flex items-start gap-3 ${
                    isPendingRelease
                        ? 'bg-orange-900/30 border-orange-700/50'
                        : 'bg-red-900/30 border-red-700/50'}`}>
                    <AlertOctagon className={`w-5 h-5 mt-0.5 shrink-0 ${isPendingRelease ? 'text-orange-400' : 'text-red-400'}`} />
                    <div className="flex-1 min-w-0">
                        {isPendingRelease ? (
                            <>
                                <p className="text-orange-300 font-bold text-sm">Maintenance Review Pending</p>
                                <p className="text-orange-400/70 text-xs mt-0.5">Your submission is awaiting manager approval. Trip posting is blocked until released.</p>
                                {latestSubmission && (
                                    <p className="text-xs text-orange-300/60 mt-1 italic">Submitted: {new Date(latestSubmission.submissionDate).toLocaleString()}</p>
                                )}
                                <p className="text-xs text-orange-300/50 mt-1">Refreshing automatically every 5s...</p>
                            </>
                        ) : (
                            <>
                                <p className="text-red-300 font-bold text-sm">🚨 Vehicle On Critical Hold — Trip Posting Blocked</p>
                                <p className="text-red-400/70 text-xs mt-0.5">Health status is CRITICAL. Complete maintenance and submit a report for manager release.</p>
                            </>
                        )}
                    </div>
                    {isOnHold && (
                        <button
                            onClick={() => onSubmitMaintenance(localVehicle)}
                            className="shrink-0 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
                            <Wrench className="w-3 h-3"/> Submit Report
                        </button>
                    )}
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        {localVehicle.vehicleNumber}
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700 tracking-wider font-mono">{localVehicle.type}</span>
                        {isPendingRelease && <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full"><Clock className="w-2.5 h-2.5 inline mr-0.5"/>Pending</span>}
                        {isOnHold && !isPendingRelease && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">ON HOLD</span>}
                    </h3>
                    <p className={`text-sm font-medium mt-1 inline-flex items-center gap-1.5 ${localVehicle.status === 'APPROVED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${localVehicle.status === 'APPROVED' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                        {localVehicle.status?.replace('_', ' ')}
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex gap-2">
                        <button 
                            onClick={onViewHealth}
                            className="relative text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                        >
                            <Activity className="w-3 h-3" /> Health Report
                            {alertCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                    {alertCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={toggleSimulation}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${simulating ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
                        >
                            {simulating ? 'STOP' : 'TEST DRIVE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* METRICS */}
            <div className="space-y-6">
                {/* Fuel & Mileage */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                    <div className="flex justify-between text-sm font-medium text-slate-300 mb-1">
                        <span className="flex items-center gap-2">
                            {localVehicle.type === 'EV' ? <Battery className="w-4 h-4 text-cyan-400" /> : <Droplet className="w-4 h-4 text-amber-400" />}
                            {localVehicle.type === 'EV' ? 'Battery Status' : 'Fuel Level'}
                        </span>
                        <span className="font-bold text-white">{localVehicle.fuelLevel || localVehicle.batteryLevel || 100}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
                        <div 
                            className={`h-full transition-all duration-1000 ${localVehicle.type === 'EV' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} 
                            style={{ width: `${localVehicle.fuelLevel || localVehicle.batteryLevel || 100}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                        <span>Mileage: <span className="text-white">{localVehicle.mileage || '--'} {localVehicle.type === 'EV' ? 'km/kWh' : 'km/l'}</span></span>
                        <span>Capacity: <span className="text-white">{localVehicle.fuelCapacity || '--'} {localVehicle.type === 'EV' ? 'kWh' : 'L'}</span></span>
                    </div>
                </div>

                {/* Odometer & Service */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                            <Gauge className="w-3 h-3" /> Odometer
                        </div>
                        <div className="text-xl font-bold text-white">{localVehicle.kmsDriven ? localVehicle.kmsDriven.toLocaleString() : 0} <span className="text-sm font-normal text-slate-500">km</span></div>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                            <PenTool className="w-3 h-3" /> Service Due
                        </div>
                        <div className="text-sm font-bold text-white mt-1">{localVehicle.nextServiceDate ? localVehicle.nextServiceDate : <span className="text-emerald-400">Up to date</span>}</div>
                    </div>
                </div>

                {/* HEALTH MONITORING GRID */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                     <div className="flex items-center gap-2 text-slate-400 text-xs mb-3 uppercase tracking-wider">
                        <Activity className="w-3 h-3" /> Vehicle Health
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Engine */}
                        <div>
                             <div className="flex justify-between text-xs mb-1 text-slate-400">
                                <span>Engine</span>
                                <span className={getHealthColor(localVehicle.engineHealth)}>{localVehicle.engineHealth || 100}%</span>
                             </div>
                             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${getHealthColorBg(localVehicle.engineHealth)}`} style={{width: `${localVehicle.engineHealth || 100}%`}}></div>
                             </div>
                        </div>
                        {/* Tires */}
                        <div>
                             <div className="flex justify-between text-xs mb-1 text-slate-400">
                                <span>Tires</span>
                                <span className={getHealthColor(localVehicle.tireHealth)}>{localVehicle.tireHealth || 100}%</span>
                             </div>
                             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${getHealthColorBg(localVehicle.tireHealth)}`} style={{width: `${localVehicle.tireHealth || 100}%`}}></div>
                             </div>
                        </div>
                        {/* Brakes */}
                        <div>
                             <div className="flex justify-between text-xs mb-1 text-slate-400">
                                <span>Brakes</span>
                                <span className={getHealthColor(localVehicle.brakePadHealth)}>{localVehicle.brakePadHealth || 100}%</span>
                             </div>
                             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${getHealthColorBg(localVehicle.brakePadHealth)}`} style={{width: `${localVehicle.brakePadHealth || 100}%`}}></div>
                             </div>
                        </div>
                        {/* Oil */}
                        <div>
                             <div className="flex justify-between text-xs mb-1 text-slate-400">
                                <span>Oil</span>
                                <span className={getHealthColor(localVehicle.oilLevel)}>{localVehicle.oilLevel || 100}%</span>
                             </div>
                             <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${getHealthColorBg(localVehicle.oilLevel)}`} style={{width: `${localVehicle.oilLevel || 100}%`}}></div>
                             </div>
                        </div>
                    </div>

                    {/* Overall Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                        <div className="text-xs text-slate-500">Overall Status</div>
                        <div className={`text-sm font-bold ${getHealthStatusColor(localVehicle.healthStatus)}`}>
                            {localVehicle.healthStatus || 'HEALTHY'} ({localVehicle.healthScore || 100})
                        </div>
                    </div>
                </div>

                {/* LiveMap Implementation */}
                {/* Clickable container opening details if needed, but LiveMap handles its own interaction too */}
                <div className="block h-48 bg-slate-900 rounded-xl relative overflow-hidden group border border-slate-800">
                    {/* Status Badge */}
                    <div className={`absolute top-3 left-3 z-20 px-3 py-1 rounded text-xs font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-2 transition-all ${simulating ? 'bg-emerald-950/90 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/90'}`}>
                        <div className={`w-2 h-2 bg-emerald-500 rounded-full ${simulating ? 'animate-ping' : ''}`}></div> 
                        {simulating ? 'LIVE TRACKING ACTIVE' : 'Vehicle Stationary'}
                    </div>

                    <div className="absolute inset-0 bg-slate-900 text-white">
                         <LiveMap 
                            center={mapCenter}
                            zoom={14}
                            vehicles={localVehicle.currentLocation ? [{
                                id: localVehicle.id,
                                vehicleNumber: localVehicle.vehicleNumber,
                                currentLocation: localVehicle.currentLocation,
                                status: localVehicle.status,
                                type: localVehicle.type,
                                model: localVehicle.model
                            }] : []}
                            className="h-full w-full"
                         />
                    </div>

                    {/* Address Text Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none z-[1000]">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {localVehicle.currentLocation || "Location Unavailable"}
                            {simulating && <span className="text-emerald-400 text-[10px] ml-2 animate-pulse">• Updating...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverVehiclesPage;
