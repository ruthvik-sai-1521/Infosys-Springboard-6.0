import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { MapPin, Battery, Droplet, Gauge, PenTool, ArrowLeft, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 12.9716,
    lng: 77.5946
};

const DriverVehiclesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);

    // Form Stats
    const [vehicleForm, setVehicleForm] = useState({
        vehicleNumber: '', type: 'SEDAN', seatCount: 4, fuelLevel: 100, kilometersDriven: 0, 
        mileage: 0, fuelCapacity: 0,
        rcDocument: '', insuranceDocument: ''
    });

    const driverId = user?.id || 1; 

    // Google Maps Loader (Lifted to Parent to avoid multiple loads)
    // IMPORTANT: Replace with valid key or use env var
    // Only attempt to load Google Maps if a key is present
    // Assuming googleMapsApiKey is defined elsewhere, e.g., from an environment variable or context
    const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ""; // Placeholder for actual key source
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: googleMapsApiKey || "", // Only works if key is valid
        preventGoogleFontsLoading: true
    });

    // If no key, treat as not loaded to trigger fallback immediately without error popup
    const isMapLoaded = googleMapsApiKey ? isLoaded : false;

    const fetchVehicles = useCallback(async () => {
        try {
            const res = await axios.get(`/api/driver/${driverId}/vehicles`);
            setVehicles(res.data);
            if (res.data.length === 0) setFormVisible(true);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [driverId]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const handleTypeChange = (e) => {
        const type = e.target.value;
        let seats = 4;
        if (type === 'SUV') seats = 7;
        if (type === 'HATCHBACK') seats = 4;
        setVehicleForm({ ...vehicleForm, type, seatCount: seats });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/driver/${driverId}/vehicle/add`, vehicleForm);
            alert("Vehicle Submitted for Approval!");
            setFormVisible(false);
            fetchVehicles();
            setVehicleForm({
                vehicleNumber: '', type: 'SEDAN', seatCount: 4, fuelLevel: 100,
                kilometersDriven: 0, mileage: 0, fuelCapacity: 0,
                rcDocument: '', insuranceDocument: ''
            });
        } catch (error) {
            alert("Error: " + (error.response?.data?.error || error.message));
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
             <Navbar />
             
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
                        <p className="text-slate-400 text-sm mt-1">Manage vehicles, track fuel & location</p>
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
                                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 bg-opacity-50 text-slate-400" 
                                        readOnly value={vehicleForm.seatCount} />
                                </div>
                            </div>
                            
                            <div>
                                 <label className="block text-sm text-slate-400 mb-1">Current Odometer (KM)</label>
                                 <div className="relative">
                                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 pl-10 text-white" 
                                        required
                                        value={vehicleForm.kilometersDriven}
                                        onChange={e => setVehicleForm({...vehicleForm, kilometersDriven: parseInt(e.target.value)})} />
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
                                    <label className="block text-sm text-slate-400 mb-1">RC Document URL</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="https://"
                                        value={vehicleForm.rcDocument}
                                        onChange={e => setVehicleForm({...vehicleForm, rcDocument: e.target.value})} />
                                </div>
                                 <div>
                                    <label className="block text-sm text-slate-400 mb-1">Insurance Document URL</label>
                                    <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white" placeholder="https://"
                                        value={vehicleForm.insuranceDocument}
                                        onChange={e => setVehicleForm({...vehicleForm, insuranceDocument: e.target.value})} />
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
                        <VehicleCard key={v.id} vehicle={v} refresh={fetchVehicles} isMapLoaded={isLoaded} />
                     ))
                    }
                </div>
            </div>
        </div>
    );
};

// Extracted Component for cleaner logic per card
const VehicleCard = ({ vehicle, refresh, isMapLoaded }) => {
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

    const toggleSimulation = async () => {
        try {
            if (!simulating) {
                // START
                await axios.post(`/api/simulation/start/${vehicle.id}`);
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
                await axios.post(`/api/simulation/stop/${vehicle.id}`);
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
        <div className={`glass-card bg-slate-900/60 p-6 rounded-2xl border transition-all shadow-xl ${simulating ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-600'}`}>
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
                    <button 
                        onClick={toggleSimulation}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${simulating ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'}`}
                    >
                        {simulating ? 'STOP TEST DRIVE' : 'START TEST DRIVE'}
                    </button>
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
                        <div className="text-xl font-bold text-white">{localVehicle.kilometersDriven ? localVehicle.kilometersDriven.toLocaleString() : 0} <span className="text-sm font-normal text-slate-500">km</span></div>
                    </div>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 uppercase tracking-wider">
                            <PenTool className="w-3 h-3" /> Service Due
                        </div>
                        <div className="text-sm font-bold text-white mt-1">{localVehicle.nextServiceDate ? localVehicle.nextServiceDate : <span className="text-emerald-400">Up to date</span>}</div>
                    </div>
                </div>

                {/* Google Map Implementation with Fallback */}
                {/* Fallback Link Logic: clickable container opening Google Maps */}
                <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${mapCenter.lat},${mapCenter.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-48 bg-slate-900 rounded-xl relative overflow-hidden group border border-slate-800 cursor-pointer"
                >
                    {/* Status Badge */}
                    <div className={`absolute top-3 left-3 z-20 px-3 py-1 rounded text-xs font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-2 transition-all ${simulating ? 'bg-emerald-950/90 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/90'}`}>
                        <div className={`w-2 h-2 bg-emerald-500 rounded-full ${simulating ? 'animate-ping' : ''}`}></div> 
                        {simulating ? 'LIVE TRACKING ACTIVE' : 'Vehicle Stationary'}
                    </div>

                    {/* Button Overlay */}
                    <div className="absolute top-3 right-3 z-30 bg-slate-900/80 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 backdrop-blur-md flex items-center gap-2 transition-all shadow-lg group-hover:scale-105">
                         <MapPin className="w-3 h-3 text-red-500" /> Open Maps
                    </div>

                    {/* Map Content */}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 group-hover:scale-105 transition-transform duration-700">
                         {isMapLoaded ? (
                            <div className="absolute inset-0 pointer-events-none opacity-50"> 
                                <GoogleMap
                                    mapContainerStyle={{width: '100%', height: '100%'}}
                                    center={mapCenter}
                                    zoom={14}
                                    options={{
                                        disableDefaultUI: true, draggable: false, zoomControl: false,
                                        styles: [
                                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }
                                        ]
                                    }}
                                >
                                    <Marker position={mapCenter} icon={{ path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", fillColor: "#ef4444", fillOpacity: 1, strokeWeight: 0, scale: 1.5 }} />
                                </GoogleMap>
                            </div>
                        ) : (
                            // Clean Fallback - No "Error" text, just a visual map-like gradient
                            <div className="absolute inset-0 bg-slate-900">
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: 'radial-gradient(circle at 50% 50%, #334155 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"></div>
                            </div>
                        )}
                    </div>

                    {/* Address Text Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {localVehicle.currentLocation || "Location Unavailable"}
                            {simulating && <span className="text-emerald-400 text-[10px] ml-2 animate-pulse">• Updating...</span>}
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default DriverVehiclesPage;
