import React, { useEffect, useState, useRef } from 'react';
import LiveMap from './LiveMap';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import axios from 'axios';

const VehicleTracker = ({ 
    vehicleId, 
    tripId, 
    showRoute = true, 
    showProgress = true 
}) => {
    const [vehicle, setVehicle] = useState(null);
    const [routeData, setRouteData] = useState(null);
    const [status, setStatus] = useState('CONNECTING'); // CONNECTING, ONLINE, OFFLINE
    const [simulationStatus, setSimulationStatus] = useState(null);
    
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch trip/route details if tripId is present
                if (tripId) {
                    const tripResponse = await axios.get(`http://localhost:8080/api/routes/trip/${tripId}`);
                    if (tripResponse.data.success) {
                        const data = tripResponse.data;
                        
                        // Construct route object for LiveMap
                        const route = {
                            coordinates: data.decodedCoordinates?.map(c => [c.latitude, c.longitude]) || [],
                            source: {
                                lat: data.sourceCoordinates?.latitude,
                                lng: data.sourceCoordinates?.longitude,
                                name: data.sourceCoordinates?.address
                            },
                            destination: {
                                lat: data.destinationCoordinates?.latitude,
                                lng: data.destinationCoordinates?.longitude,
                                name: data.destinationCoordinates?.address
                            }
                        };
                        setRouteData(route);
                    }
                }

                // Fetch initial simulation status if available
                if (vehicleId) {
                    try {
                        const statusResponse = await axios.get(`http://localhost:8080/api/simulation/status/${vehicleId}`);
                        if (statusResponse.data.success && statusResponse.data.status !== "NOT_RUNNING") {
                            setSimulationStatus(statusResponse.data.status);
                            
                            // Set initial vehicle position from status
                            const currentLoc = statusResponse.data.status.currentLocation;
                            if (currentLoc) {
                                setVehicle({
                                    id: vehicleId,
                                    location: { lat: currentLoc.latitude, lng: currentLoc.longitude },
                                    status: 'ACTIVE', // Or derive from simulation status
                                    heading: 0 // Could be calculated or provided
                                });
                            }
                        }
                    } catch (e) {
                         console.warn("No active simulation found initially");
                    }
                }

            } catch (error) {
                console.error("Error fetching initial tracker data:", error);
            }
        };

        if (vehicleId || tripId) {
            fetchData();
        }
    }, [vehicleId, tripId]);

    // WebSocket Connection
    useEffect(() => {
        if (!vehicleId) return;

        const connectWebSocket = () => {
            const socket = new SockJS('http://localhost:8080/ws');
            const client = Stomp.over(socket);
            
            // Disable debug logs for cleaner console
            client.debug = () => {};

            client.connect({}, () => {
                setStatus('ONLINE');
                
                // Subscribe to vehicle specific topic
                subscriptionRef.current = client.subscribe(`/topic/vehicle/${vehicleId}`, (message) => {
                    const locationUpdate = JSON.parse(message.body);
                    
                    setVehicle(prev => ({
                        ...prev,
                        id: vehicleId,
                        location: { 
                            lat: locationUpdate.latitude, 
                            lng: locationUpdate.longitude 
                        },
                        status: 'ACTIVE',
                        heading: locationUpdate.heading || 0,
                        speed: locationUpdate.speed,
                        timestamp: locationUpdate.timestamp
                    }));

                    // Update simulation status if needed (e.g. progress)
                    setSimulationStatus(prev => {
                        if (prev) {
                            return {
                                ...prev,
                                distanceCoveredMeters: locationUpdate.distanceCovered,
                                totalDistanceMeters: prev.totalDistanceMeters || locationUpdate.totalDistance // Fallback
                            };
                        }
                        return prev;
                    });
                });

            }, (error) => {
                console.error("WebSocket connection error:", error);
                setStatus('OFFLINE');
            });

            stompClientRef.current = client;
        };

        connectWebSocket();

        // Cleanup on unmount
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect();
            }
        };
    }, [vehicleId]);

    // Calculate progress percentage
    const progressPercentage = simulationStatus 
        ? Math.min(100, Math.max(0, (simulationStatus.distanceCoveredMeters / simulationStatus.totalDistanceMeters) * 100))
        : 0;

    return (
        <div className="space-y-4">
            {/* Status Header */}
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status === 'ONLINE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    <span className="text-xs font-mono text-gray-400">
                        {status === 'ONLINE' ? 'LIVE TRACKING' : 'CONNECTING...'}
                    </span>
                </div>
                {vehicle && vehicle.speed !== undefined && (
                    <div className="text-xs font-mono text-blue-400">
                        {vehicle.speed.toFixed(1)} km/h
                    </div>
                )}
            </div>

            {/* Map */}
            <LiveMap 
                vehicles={vehicle ? [vehicle] : []}
                route={showRoute ? routeData : null}
                className="h-[400px]"
                zoom={15} // Closer zoom for tracking
                // If we have a vehicle, center on it, otherwise use route source or default
                center={vehicle?.location || routeData?.source || undefined} 
            />

            {/* Progress Bar */}
            {showProgress && simulationStatus && (
                <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500 font-mono">
                        <span>{((simulationStatus.distanceCoveredMeters || 0) / 1000).toFixed(2)} km</span>
                        <span>{((simulationStatus.totalDistanceMeters || 0) / 1000).toFixed(2)} km</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleTracker;
