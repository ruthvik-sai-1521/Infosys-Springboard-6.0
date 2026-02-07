import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { MapPin, Battery, Droplet, Gauge, PenTool, ArrowLeft, PlusCircle, Activity, X } from 'lucide-react';
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

    // WebSocket
    const stompClientRef = useRef(null);

    // Form Stats
    const [vehicleForm, setVehicleForm] = useState({
        vehicleNumber: '', type: 'SEDAN', seatCount: 3, fuelLevel: 100, kmsDriven: 0, 
        mileage: 0, fuelCapacity: 0,
        rcPdfUrl: '', insurancePdfUrl: ''
    });

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

    useEffect(() => {
        if (driverId) {
            fetchVehicles();
            fetchAlerts();
            connectWebSocket();
        } else {
             setLoading(false);
        }

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [fetchVehicles, fetchAlerts, driverId]);

    const connectWebSocket = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                // Subscribe to Driver Alerts
                client.subscribe(`/topic/alerts/driver/${driverId}`, (message) => {
                    const alert = JSON.parse(message.body);
                    handleNewAlert(alert);
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
        if (!driverId) {
            alert("User not authenticated properly. Please reload.");
            return;
        }
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            await axios.post(`/api/driver/${driverId}/vehicle/add`, vehicleForm, config);
            alert("Vehicle Submitted for Approval!");
            setFormVisible(false);
            fetchVehicles();
            setVehicleForm({
                vehicleNumber: '', type: 'SEDAN', seatCount: 3, fuelLevel: 100,
                kmsDriven: 0, mileage: 0, fuelCapacity: 0,
                rcPdfUrl: '', insurancePdfUrl: ''
            });
        } catch (error) {
            alert("Error: " + (error.response?.data?.error || error.message));
        }
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
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">RC Document URL (PDF/Link)</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="https://"
                                        value={vehicleForm.rcPdfUrl}
                                        onChange={e => setVehicleForm({...vehicleForm, rcPdfUrl: e.target.value})} />
                                </div>
                                 <div>
                                    <label className="block text-sm text-slate-400 mb-1">Insurance Document URL (PDF/Link)</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="https://"
                                        value={vehicleForm.insurancePdfUrl}
                                        onChange={e => setVehicleForm({...vehicleForm, insurancePdfUrl: e.target.value})} />
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
        </div>
    );
};

// Extracted Component for cleaner logic per card
const VehicleCard = ({ vehicle, refresh, alertCount = 0, onViewHealth }) => {
    const [simulating, setSimulating] = useState(false);
    const [localVehicle, setLocalVehicle] = useState(vehicle);
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

    return (
        <div className={`glass-card bg-slate-900/60 p-6 rounded-2xl border transition-all shadow-xl ${simulating ? 'border-emerald-500/50 shadow-emerald-500/10' : alertCount > 0 ? 'border-amber-500/30' : 'border-slate-800 hover:border-slate-600'}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        {localVehicle.vehicleNumber}
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700 tracking-wider font-mono">{localVehicle.type}</span>
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
