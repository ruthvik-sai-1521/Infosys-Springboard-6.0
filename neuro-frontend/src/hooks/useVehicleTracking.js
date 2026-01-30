import { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * Custom Hook: useVehicleTracking
 * 
 * Manages WebSocket connection for real-time vehicle tracking
 * 
 * @param {number} vehicleId - Vehicle ID to track
 * @param {number} tripId - Trip ID (optional, for trip-specific updates)
 * @param {boolean} enabled - Enable/disable tracking (default: true)
 * @param {string} serverUrl - WebSocket server URL (default: http://localhost:8080)
 * 
 * @returns {object} {
 *   location: {latitude, longitude, altitude} | null,
 *   progress: {currentIndex, totalPoints, percentage, distanceTraveled, etc} | null,
 *   status: string (ACTIVE, IDLE, etc),
 *   speed: number | null,
 *   heading: number | null,
 *   isConnected: boolean,
 *   error: string | null,
 *   lastUpdate: number (timestamp) | null
 * }
 */
const useVehicleTracking = (
    vehicleId, 
    tripId = null, 
    enabled = true, 
    serverUrl = 'http://localhost:8080'
) => {
    const [location, setLocation] = useState(null);
    const [progress, setProgress] = useState(null);
    const [status, setStatus] = useState('UNKNOWN');
    const [speed, setSpeed] = useState(null);
    const [heading, setHeading] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        if (!enabled || !vehicleId) {
            return;
        }

        // Create WebSocket connection
        const socket = new SockJS(`${serverUrl}/ws-tracking`);
        const stompClient = Stomp.over(socket);

        // Disable debug logging
        stompClient.debug = () => {};

        stompClientRef.current = stompClient;

        // Connect
        stompClient.connect(
            {},
            (frame) => {
                console.log('✅ WebSocket connected for vehicle:', vehicleId);
                setIsConnected(true);
                setError(null);

                // Subscribe to vehicle updates
                const subscription = stompClient.subscribe(
                    `/topic/vehicle/${vehicleId}`,
                    (message) => {
                        try {
                            const update = JSON.parse(message.body);
                            
                            // Handle different message types
                            if (update.type === 'subscription_confirmed') {
                                console.log('Subscription confirmed for vehicle:', vehicleId);
                                return;
                            }

                            if (update.type === 'location_not_found') {
                                console.warn('No location found for vehicle:', vehicleId);
                                return;
                            }

                            // Update state with location data
                            if (update.location) {
                                setLocation(update.location);
                            }

                            if (update.progress) {
                                setProgress(update.progress);
                            }

                            if (update.status) {
                                setStatus(update.status);
                            }

                            if (update.speed !== undefined) {
                                setSpeed(update.speed);
                            }

                            if (update.heading !== undefined) {
                                setHeading(update.heading);
                            }

                            setLastUpdate(Date.now());
                            
                        } catch (err) {
                            console.error('Error parsing location update:', err);
                        }
                    }
                );

                subscriptionRef.current = subscription;

                // Optionally subscribe to trip updates
                if (tripId) {
                    stompClient.subscribe(`/topic/trip/${tripId}`, (message) => {
                        try {
                            const update = JSON.parse(message.body);
                            // Handle trip-specific updates
                            if (update.progress) {
                                setProgress(update.progress);
                            }
                        } catch (err) {
                            console.error('Error parsing trip update:', err);
                        }
                    });
                }

                // Request current location
                stompClient.send(`/app/getLocation/${vehicleId}`, {}, JSON.stringify({}));
            },
            (error) => {
                console.error('❌ WebSocket connection error:', error);
                setIsConnected(false);
                setError(error.toString());
            }
        );

        // Cleanup on unmount
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect(() => {
                    console.log('Disconnected from WebSocket');
                });
            }
        };
    }, [vehicleId, tripId, enabled, serverUrl]);

    return {
        location,
        progress,
        status,
        speed,
        heading,
        isConnected,
        error,
        lastUpdate,
    };
};

export default useVehicleTracking;
