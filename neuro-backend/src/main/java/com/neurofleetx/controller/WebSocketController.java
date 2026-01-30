package com.neurofleetx.controller;

import com.neurofleetx.dto.LocationUpdateMessage;
import com.neurofleetx.dto.SimulationStatus;
import com.neurofleetx.model.VehicleLocation;
import com.neurofleetx.repository.VehicleLocationRepository;
import com.neurofleetx.service.VehicleSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * WebSocket Controller for Live Vehicle Tracking
 * 
 * Handles WebSocket message subscriptions and broadcasts for real-time location
 * updates
 * 
 * Client subscribes to:
 * - /topic/vehicle/{vehicleId} - Updates for specific vehicle
 * - /topic/trip/{tripId} - Updates for specific trip
 * - /topic/manager/vehicles - All vehicle updates for managers
 * 
 * Client sends to:
 * - /app/subscribe/vehicle/{vehicleId}
 * - /app/subscribe/trip/{tripId}
 * - /app/unsubscribe/vehicle/{vehicleId}
 * - /app/unsubscribe/trip/{tripId}
 * - /app/getLocation/{vehicleId}
 * - /app/getAllLocations
 */
@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private VehicleSimulationService simulationService;

    @Autowired
    private VehicleLocationRepository vehicleLocationRepository;

    /**
     * Subscribe to vehicle updates
     * Client sends to: /app/subscribe/vehicle/{vehicleId}
     * Auto-subscribes to: /topic/vehicle/{vehicleId}
     */
    @MessageMapping("/subscribe/vehicle/{vehicleId}")
    @SendTo("/topic/vehicle/{vehicleId}")
    public Map<String, Object> subscribeToVehicle(@DestinationVariable Long vehicleId) {
        System.out.println("Client subscribed to vehicle: " + vehicleId);

        // Send current status immediately
        SimulationStatus status = simulationService.getSimulationStatus(vehicleId);

        Map<String, Object> response = new HashMap<>();
        response.put("type", "subscription_confirmed");
        response.put("vehicleId", vehicleId);
        response.put("status", status != null ? status : "NOT_RUNNING");
        response.put("timestamp", System.currentTimeMillis());

        return response;
    }

    /**
     * Subscribe to trip updates
     * Client sends to: /app/subscribe/trip/{tripId}
     * Auto-subscribes to: /topic/trip/{tripId}
     */
    @MessageMapping("/subscribe/trip/{tripId}")
    @SendTo("/topic/trip/{tripId}")
    public Map<String, Object> subscribeToTrip(@DestinationVariable Long tripId) {
        System.out.println("Client subscribed to trip: " + tripId);

        Map<String, Object> response = new HashMap<>();
        response.put("type", "subscription_confirmed");
        response.put("tripId", tripId);
        response.put("timestamp", System.currentTimeMillis());

        return response;
    }

    /**
     * Unsubscribe from vehicle updates
     * Client sends to: /app/unsubscribe/vehicle/{vehicleId}
     */
    @MessageMapping("/unsubscribe/vehicle/{vehicleId}")
    public void unsubscribeFromVehicle(@DestinationVariable Long vehicleId) {
        System.out.println("Client unsubscribed from vehicle: " + vehicleId);
        // Spring handles unsubscription automatically when client disconnects or
        // explicitly unsubscribes
    }

    /**
     * Unsubscribe from trip updates
     * Client sends to: /app/unsubscribe/trip/{tripId}
     */
    @MessageMapping("/unsubscribe/trip/{tripId}")
    public void unsubscribeFromTrip(@DestinationVariable Long tripId) {
        System.out.println("Client unsubscribed from trip: " + tripId);
    }

    /**
     * Get current location for a vehicle
     * Client sends to: /app/getLocation/{vehicleId}
     * Response sent to: /topic/vehicle/{vehicleId}
     */
    @MessageMapping("/getLocation/{vehicleId}")
    public void getVehicleLocation(@DestinationVariable Long vehicleId) {
        // Get most recent location from database
        Optional<VehicleLocation> locationOpt = vehicleLocationRepository
                .findTopByVehicleIdOrderByTimestampDesc(vehicleId);

        if (locationOpt.isPresent()) {
            VehicleLocation loc = locationOpt.get();

            LocationUpdateMessage message = createLocationMessage(loc);

            // Send to vehicle-specific topic
            messagingTemplate.convertAndSend("/topic/vehicle/" + vehicleId, message);
        } else {
            // Send "no location" message
            Map<String, Object> response = new HashMap<>();
            response.put("type", "location_not_found");
            response.put("vehicleId", vehicleId);
            response.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/vehicle/" + vehicleId, (Object) response);
        }
    }

    /**
     * Get all active vehicle locations
     * Client sends to: /app/getAllLocations
     * Response sent back to sender via /queue/locations
     */
    @MessageMapping("/getAllLocations")
    @SendTo("/topic/manager/vehicles")
    public Map<String, Object> getAllVehicleLocations() {
        // Get all active simulations
        Map<Long, SimulationStatus> activeSimulations = simulationService.getAllActiveSimulations();

        // Get recent locations for all vehicles
        List<VehicleLocation> recentLocations = vehicleLocationRepository
                .findAll()
                .stream()
                .collect(Collectors.groupingBy(VehicleLocation::getVehicleId))
                .values()
                .stream()
                .map(list -> list.stream()
                        .max((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()))
                        .orElse(null))
                .filter(loc -> loc != null)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("type", "all_locations");
        response.put("count", recentLocations.size());
        response.put("activeSimulations", activeSimulations.size());
        response.put("locations", recentLocations.stream()
                .map(this::createLocationMessage)
                .collect(Collectors.toList()));
        response.put("timestamp", System.currentTimeMillis());

        return response;
    }

    /**
     * Broadcast location update to all relevant topics
     * Called by VehicleSimulationService on each tick
     */
    public void broadcastLocationUpdate(Long vehicleId, Long tripId, VehicleLocation location,
            SimulationStatus status) {
        LocationUpdateMessage message = createLocationMessage(location);

        // Add progress info from status
        if (status != null) {
            LocationUpdateMessage.Progress progress = new LocationUpdateMessage.Progress();
            progress.setCurrentIndex(status.getCurrentIndex());
            progress.setTotalPoints(status.getTotalPoints());
            progress.setPercentage(status.getProgressPercentage());
            progress.setDistanceTraveled(status.getDistanceTraveled());
            progress.setTotalDistance(null); // Could be added if needed
            progress.setElapsedTimeSeconds(status.getElapsedTimeSeconds());
            progress.setRemainingTimeSeconds(status.getRemainingTimeSeconds());
            message.setProgress(progress);
            message.setStatus(status.getStatus());
        }

        // Broadcast to vehicle-specific topic
        messagingTemplate.convertAndSend("/topic/vehicle/" + vehicleId, message);

        // Broadcast to trip-specific topic
        if (tripId != null) {
            messagingTemplate.convertAndSend("/topic/trip/" + tripId, message);
        }

        // Broadcast to manager's all-vehicles topic
        messagingTemplate.convertAndSend("/topic/manager/vehicles", message);

        System.out.println("Broadcasted location update for vehicle " + vehicleId);
    }

    /**
     * Helper: Create LocationUpdateMessage from VehicleLocation
     */
    private LocationUpdateMessage createLocationMessage(VehicleLocation loc) {
        LocationUpdateMessage message = new LocationUpdateMessage();
        message.setVehicleId(loc.getVehicleId());
        message.setTripId(loc.getTripId());
        message.setDriverId(loc.getDriverId());

        LocationUpdateMessage.Location location = new LocationUpdateMessage.Location();
        location.setLatitude(loc.getLatitude());
        location.setLongitude(loc.getLongitude());
        location.setAltitude(loc.getAltitude());
        message.setLocation(location);

        message.setSpeed(loc.getSpeed());
        message.setHeading(loc.getHeading());
        message.setStatus(loc.getLocationStatus());
        message.setTimestamp(System.currentTimeMillis());

        return message;
    }
}
