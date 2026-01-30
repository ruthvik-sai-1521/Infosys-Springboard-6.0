import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { Search, X, Phone, Mail, MapPin, Gauge, Info, MessageSquare, DollarSign, Star, History } from 'lucide-react';
import axios from 'axios';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom vehicle icon creator
const createVehicleIcon = (status, heading = 0) => {
    const colors = {
        'PARKED': '#6b7280', // gray
        'MOVING_TO_PICKUP': '#f59e0b', // yellow
        'ON_TRIP': '#10b981', // green
        'IDLE': '#94a3b8', // slate
        'OFFLINE': '#374151' // dark gray
    };

    const color = colors[status] || colors['IDLE'];

    return L.divIcon({
        html: `
            <div style="transform: rotate(${heading}deg); transform-origin: center;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
                    <path d="M12 2L4 7v5c0 5 8 10 8 10s8-5 8-10V7l-8-5z"/>
                    <circle cx="12" cy="12" r="3" fill="white" />
                </svg>
            </div>
        `,
        className: 'custom-vehicle-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// Map auto-bounds component
const AutoBounds = ({ vehicles }) => {
    const map = useMap();

    useEffect(() => {
        if (vehicles.length > 0) {
            const validLocations = vehicles.filter(v => 
                v.lastLatitude && v.lastLongitude
            );

            if (validLocations.length > 0) {
                const bounds = L.latLngBounds(
                    validLocations.map(v => [v.lastLatitude, v.lastLongitude])
                );
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [vehicles, map]);

    return null;
};

const FleetTracking = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailVehicle, setDetailVehicle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);

    // WebSocket refs
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Fetch initial vehicles
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
                const res = await axios.get('/api/admin/vehicles', config);
                setVehicles(res.data);
                setFilteredVehicles(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch vehicles:', err);
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    // WebSocket connection for real-time updates
    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws-tracking');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            console.log('Fleet tracking WebSocket connected');
            setIsConnected(true);

            // Subscribe to manager vehicles topic
            subscriptionRef.current = client.subscribe('/topic/manager/vehicles', (message) => {
                const update = JSON.parse(message.body);
                
                setVehicles(prev => {
                    const index = prev.findIndex(v => v.id === update.vehicleId);
                    if (index !== -1) {
                        const updated = [...prev];
                        updated[index] = {
                            ...updated[index],
                            lastLatitude: update.location.latitude,
                            lastLongitude: update.location.longitude,
                            heading: update.heading,
                            speed: update.speed,
                            status: mapTripStatusToVehicleStatus(update.status),
                            lastUpdate: new Date()
                        };
                        return updated;
                    }
                    return prev;
                });
            });

            stompClientRef.current = client;
        }, (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
        });

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect();
            }
        };
    }, []);

    // Map trip status to vehicle status
    const mapTripStatusToVehicleStatus = (tripStatus) => {
        const statusMap = {
            'SCHEDULED': 'MOVING_TO_PICKUP',
            'IN_PROGRESS': 'ON_TRIP',
            'COMPLETED': 'PARKED'
        };
        return statusMap[tripStatus] || 'IDLE';
    };

    // Search filtering
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredVehicles(vehicles);
            setSelectedVehicle(null);
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = vehicles.filter(v => 
            v.vehicleNumber?.toLowerCase().includes(term) ||
            v.licensePlate?.toLowerCase().includes(term) ||
            v.driverName?.toLowerCase().includes(term) ||
            v.model?.toLowerCase().includes(term)
        );

        setFilteredVehicles(filtered);

        // Auto-select first match
        if (filtered.length > 0) {
            setSelectedVehicle(filtered[0]);
        }
    }, [searchTerm, vehicles]);

    const handleViewDetails = async (vehicle) => {
        setDetailVehicle(vehicle);
        setIsDetailModalOpen(true);

        // Fetch additional details if needed
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            // Fetch trip history, earnings, feedbacks, etc.
            // This is placeholder - adjust based on your actual endpoints
        } catch (err) {
            console.error('Failed to fetch vehicle details:', err);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'PARKED': { color: 'bg-gray-500', text: 'Parked' },
            'MOVING_TO_PICKUP': { color: 'bg-yellow-500', text: 'Moving to Pickup' },
            'ON_TRIP': { color: 'bg-green-500', text: 'On Trip' },
            'IDLE': { color: 'bg-slate-500', text: 'Idle' },
            'OFFLINE': { color: 'bg-gray-700', text: 'Offline' }
        };

        const badge = badges[status] || badges['IDLE'];
        return (
            <span className={`${badge.color} text-white text-xs px-2 py-1 rounded-full font-bold`}>
                {badge.text}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-slate-900/50 border-b border-slate-700 p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-blue-500" />
                        Fleet Tracking
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* Connection Status */}
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            {isConnected ? 'Live Updates Active' : 'Disconnected'}
                        </div>
                        <div className="text-sm text-slate-400">
                            {vehicles.length} Vehicles
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by vehicle number, driver name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-10 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content - Split View */}
            <div className="flex-1 flex overflow-hidden">
                {/* Map Section */}
                <div className="flex-1 relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <MapContainer
                            center={[12.9716, 77.5946]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            <AutoBounds vehicles={filteredVehicles} />
                            
                            {filteredVehicles.map(vehicle => {
                                if (!vehicle.lastLatitude || !vehicle.lastLongitude) return null;

                                return (
                                    <Marker
                                        key={vehicle.id}
                                        position={[vehicle.lastLatitude, vehicle.lastLongitude]}
                                        icon={createVehicleIcon(vehicle.status || 'IDLE', vehicle.heading || 0)}
                                    >
                                        <Popup>
                                            <div className="text-sm">
                                                <p className="font-bold">{vehicle.vehicleNumber}</p>
                                                <p className="text-xs text-gray-600">{vehicle.model}</p>
                                                <p className="text-xs">Driver: {vehicle.driverName || 'Not assigned'}</p>
                                                <p className="text-xs">Speed: {vehicle.speed || 0} km/h</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                );
                            })}
                        </MapContainer>
                    )}
                </div>

                {/* Vehicle List Panel */}
                <div className="w-96 bg-slate-900/50 border-l border-slate-700 overflow-y-auto">
                    <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                            Vehicle List ({filteredVehicles.length})
                        </h3>
                    </div>

                    {filteredVehicles.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            No vehicles found
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {filteredVehicles.map(vehicle => (
                                <div
                                    key={vehicle.id}
                                    className={`p-4 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                                        selectedVehicle?.id === vehicle.id ? 'bg-slate-800/70 border-l-4 border-blue-500' : ''
                                    }`}
                                    onClick={() => setSelectedVehicle(vehicle)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-white">{vehicle.vehicleNumber}</h4>
                                            <p className="text-xs text-slate-400">{vehicle.model}</p>
                                        </div>
                                        {getStatusBadge(vehicle.status || 'IDLE')}
                                    </div>

                                    <div className="space-y-1 text-xs text-slate-400 mb-3">
                                        <p className="flex items-center gap-1">
                                            <span className="font-semibold text-slate-300">Driver:</span>
                                            {vehicle.driverName || 'Not assigned'}
                                        </p>
                                        {vehicle.currentTripInfo && (
                                            <p className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {vehicle.currentTripInfo}
                                            </p>
                                        )}
                                        <p className="flex items-center gap-1">
                                            <Gauge className="w-3 h-3" />
                                            {vehicle.speed || 0} km/h
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // TODO: Open live tracking
                                            }}
                                        >
                                            <Gauge className="w-3 h-3" /> Live
                                        </button>
                                        <button
                                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(vehicle);
                                            }}
                                        >
                                            <Info className="w-3 h-3" /> Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Vehicle Detail Modal */}
            {isDetailModalOpen && detailVehicle && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Info className="w-6 h-6 text-blue-500" />
                                    Vehicle Details
                                </h2>
                                <p className="text-sm text-slate-400">{detailVehicle.vehicleNumber} • {detailVehicle.model}</p>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Vehicle Info Card */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Vehicle Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">License Plate</p>
                                        <p className="text-white font-semibold">{detailVehicle.licensePlate}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Model</p>
                                        <p className="text-white font-semibold">{detailVehicle.model}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Type</p>
                                        <p className="text-white font-semibold">{detailVehicle.type || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Status</p>
                                        {getStatusBadge(detailVehicle.status || 'IDLE')}
                                    </div>
                                </div>
                            </div>

                            {/* Driver Info Card */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Driver Information</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                                        {detailVehicle.driverName?.charAt(0) || 'D'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-bold">{detailVehicle.driverName || 'Not assigned'}</p>
                                        <p className="text-xs text-slate-400">{detailVehicle.driverEmail || 'N/A'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`tel:${detailVehicle.driverPhone || ''}`}
                                            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors"
                                        >
                                            <Phone className="w-5 h-5" />
                                        </a>
                                        <a
                                            href={`mailto:${detailVehicle.driverEmail || ''}`}
                                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors"
                                        >
                                            <Mail className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                    <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 mb-1">Total Earnings</p>
                                    <p className="text-xl font-bold text-white">₹0</p>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                    <History className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 mb-1">Total Trips</p>
                                    <p className="text-xl font-bold text-white">0</p>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                    <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                                    <p className="text-xs text-slate-500 mb-1">Avg Rating</p>
                                    <p className="text-xl font-bold text-white">0.0</p>
                                </div>
                            </div>

                            {/* Trip History */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 mb-6">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Trips</h3>
                                <div className="text-center text-slate-500 py-8">
                                    No trip history available
                                </div>
                            </div>

                            {/* Feedbacks */}
                            <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Feedbacks</h3>
                                <div className="text-center text-slate-500 py-8">
                                    No feedbacks available
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FleetTracking;
