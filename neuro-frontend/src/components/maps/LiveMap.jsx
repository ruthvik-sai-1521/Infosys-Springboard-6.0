import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Car, MapPin, Flag } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Auto-fit map bounds to show all markers
 */
const AutoFitBounds = ({ bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);

    return null;
};

/**
 * Create custom vehicle marker icon with status color
 */
const createVehicleIcon = (status = 'ACTIVE', heading = 0) => {
    const colors = {
        ACTIVE: '#10b981', // green
        IN_TRANSIT: '#3b82f6', // blue
        IDLE: '#f59e0b', // amber
        OFFLINE: '#6b7280', // gray
    };

    const color = colors[status] || colors.IDLE;

    return L.divIcon({
        html: `
            <div style="transform: rotate(${heading}deg); transition: transform 0.3s ease;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                </svg>
            </div>
        `,
        className: 'vehicle-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

/**
 * Create source/destination marker icons
 */
const createLocationIcon = (type = 'source') => {
    const config = {
        source: { color: '#3b82f6', label: 'A' },
        destination: { color: '#ef4444', label: 'B' },
    };

    const { color, label } = config[type];

    return L.divIcon({
        html: `
            <div class="flex flex-col items-center">
                <svg width="32" height="40" viewBox="0 0 24 30" fill="${color}" stroke="white" stroke-width="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <div class="absolute top-2 text-white font-bold text-xs">${label}</div>
            </div>
        `,
        className: 'location-marker',
        iconSize: [32, 40],
        iconAnchor: [16, 40],
    });
};

/**
 * LiveMap Component
 * 
 * @param {array} vehicles - Array of vehicle objects [{id, location: {lat, lng}, status, driverName, vehicleNumber, heading}]
 * @param {object} route - { coordinates: [[lat,lng]...], source: {lat, lng}, destination: {lat, lng} }
 * @param {object} center - Initial center {lat, lng} (default: Bangalore)
 * @param {number} zoom - Initial zoom level (default: 13)
 * @param {function} onVehicleClick - Callback when vehicle marker is clicked (vehicleId)
 * @param {string} className - Wrapper class name
 */
const LiveMap = ({ 
    vehicles = [], 
    route = null, 
    center = { lat: 12.9716, lng: 77.5946 }, 
    zoom = 13,
    onVehicleClick,
    className = ""
}) => {
    const mapRef = useRef(null);

    // Calculate bounds for auto-fit
    const calculateBounds = () => {
        const points = [];

        // Add vehicle positions
        vehicles.forEach(v => {
            if (v && v.location && typeof v.location.lat === 'number' && typeof v.location.lng === 'number') {
                points.push([v.location.lat, v.location.lng]);
            }
        });

        // Add route points and start/end
        if (route) {
            if (Array.isArray(route.coordinates)) {
                route.coordinates.forEach(p => {
                    // Ensure point is [lat, lng] or {lat, lng}
                    if (Array.isArray(p) && p.length >= 2) {
                        points.push(p);
                    } else if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
                        points.push([p.lat, p.lng]);
                    }
                });
            }

            if (route.source && typeof route.source.lat === 'number' && typeof route.source.lng === 'number') {
                points.push([route.source.lat, route.source.lng]);
            }
            if (route.destination && typeof route.destination.lat === 'number' && typeof route.destination.lng === 'number') {
                points.push([route.destination.lat, route.destination.lng]);
            }
        }

        return points.length > 0 ? points : null;
    };

    const bounds = calculateBounds();
    const centerPosition = [center.lat, center.lng];

    return (
        <div className={`rounded-lg overflow-hidden border border-slate-700 shadow-2xl relative z-0 ${className}`}>
            <MapContainer
                center={centerPosition}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                {/* Dark theme tile layer */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Auto-fit bounds if we have points */}
                {bounds && <AutoFitBounds bounds={bounds} />}

                {/* Route Visualization */}
                {route && (
                    <>
                        {/* Source marker */}
                        {route.source && typeof route.source.lat === 'number' && typeof route.source.lng === 'number' && (
                            <Marker 
                                position={[route.source.lat, route.source.lng]} 
                                icon={createLocationIcon('source')}
                            >
                                <Popup>
                                    <div className="text-sm font-semibold">Start Location</div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Destination marker */}
                        {route.destination && typeof route.destination.lat === 'number' && typeof route.destination.lng === 'number' && (
                            <Marker 
                                position={[route.destination.lat, route.destination.lng]} 
                                icon={createLocationIcon('destination')}
                            >
                                <Popup>
                                    <div className="text-sm font-semibold">Destination</div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Route polyline */}
                        {route.coordinates && route.coordinates.length > 0 && (
                            <Polyline 
                                positions={route.coordinates} 
                                color="#3b82f6" 
                                weight={4} 
                                opacity={0.7}
                            />
                        )}
                    </>
                )}

                {/* Vehicle markers */}
                {vehicles.map((vehicle) => (
                    vehicle && vehicle.location && typeof vehicle.location.lat === 'number' && typeof vehicle.location.lng === 'number' ? (
                    <Marker
                        key={vehicle.id}
                        position={[vehicle.location.lat, vehicle.location.lng]}
                        icon={createVehicleIcon(vehicle.status, vehicle.heading || 0)}
                        eventHandlers={{
                            click: () => onVehicleClick && onVehicleClick(vehicle.id),
                        }}
                    >
                        <Popup>
                            <div className="text-sm">
                                <strong>{vehicle.vehicleNumber || `Vehicle #${vehicle.id}`}</strong>
                                {vehicle.driverName && <p className="text-gray-500">{vehicle.driverName}</p>}
                                <p>Status: <span className="font-semibold">{vehicle.status || 'UNKNOWN'}</span></p>
                            </div>
                        </Popup>
                    </Marker>
                    ) : null
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveMap;
