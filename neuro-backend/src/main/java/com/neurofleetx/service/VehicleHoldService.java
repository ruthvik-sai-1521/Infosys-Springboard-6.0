package com.neurofleetx.service;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class VehicleHoldService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Hold a vehicle with a specific reason
     * Prevents trip creation and notifies driver
     */
    @Transactional
    public void holdVehicle(Long vehicleId, String reason) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        // Only hold if not already on hold
        if (!"ON_HOLD".equals(vehicle.getHoldStatus())) {
            vehicle.setHoldStatus("ON_HOLD");
            vehicle.setHoldReason(reason);
            vehicle.setHeldAt(LocalDateTime.now());

            vehicleRepository.save(vehicle);

            System.out.println("Vehicle " + vehicleId + " placed ON_HOLD: " + reason);

            // Notify driver via WebSocket
            notifyDriverVehicleHeld(vehicle);
        }
    }

    /**
     * Release a vehicle from hold after manager approval
     */
    @Transactional
    public void releaseVehicle(Long vehicleId, Long managerId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        // Release if ON_HOLD or PENDING_RELEASE (driver submitted maintenance form)
        String currentStatus = vehicle.getHoldStatus();
        if ("ON_HOLD".equals(currentStatus) || "PENDING_RELEASE".equals(currentStatus)) {
            vehicle.setHoldStatus("ACTIVE");
            vehicle.setReleasedAt(LocalDateTime.now());
            vehicle.setHoldReason(null); // Clear reason after release

            vehicleRepository.save(vehicle);

            System.out.println("Vehicle " + vehicleId + " released from hold (was: " + currentStatus + ") by manager "
                    + managerId);

            // Notify driver via WebSocket
            notifyDriverVehicleReleased(vehicle);
        }
    }

    /**
     * Check if vehicle can be used for trip creation
     * Returns false if vehicle is ON_HOLD or PENDING_RELEASE
     * Treats null or empty holdStatus as ACTIVE (backward compatibility)
     */
    public boolean canCreateTrip(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        // Treat null or empty as ACTIVE (for existing vehicles without the field)
        String status = vehicle.getHoldStatus();
        if (status == null || status.isEmpty()) {
            return true; // Backward compatibility - no hold status means active
        }

        return "ACTIVE".equals(status);
    }

    /**
     * Check if vehicle can be used (same as canCreateTrip for now)
     */
    public boolean isVehicleAvailable(Long vehicleId) {
        return canCreateTrip(vehicleId);
    }

    /**
     * Get all vehicles currently on hold
     */
    public List<Vehicle> getHeldVehicles() {
        return vehicleRepository.findByHoldStatus("ON_HOLD");
    }

    /**
     * Get vehicle hold status details
     */
    public Map<String, Object> getHoldStatus(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found with id: " + vehicleId));

        // Handle null values for backward compatibility
        String holdStatus = vehicle.getHoldStatus() != null ? vehicle.getHoldStatus() : "ACTIVE";

        return Map.of(
                "vehicleId", vehicle.getId(),
                "vehicleNumber", vehicle.getVehicleNumber(),
                "holdStatus", holdStatus,
                "holdReason", vehicle.getHoldReason() != null ? vehicle.getHoldReason() : "",
                "heldAt", vehicle.getHeldAt() != null ? vehicle.getHeldAt().toString() : "",
                "canCreateTrip", "ACTIVE".equals(holdStatus));
    }

    /**
     * Notify driver that their vehicle has been placed on hold
     */
    private void notifyDriverVehicleHeld(Vehicle vehicle) {
        if (messagingTemplate == null || vehicle.getDriver() == null) {
            return;
        }

        try {
            Map<String, Object> notification = Map.of(
                    "type", "VEHICLE_HOLD",
                    "vehicleId", vehicle.getId(),
                    "vehicleNumber", vehicle.getVehicleNumber(),
                    "holdStatus", vehicle.getHoldStatus(),
                    "holdReason", vehicle.getHoldReason() != null ? vehicle.getHoldReason() : "",
                    "heldAt", vehicle.getHeldAt().toString(),
                    "message",
                    "Your vehicle has been placed on hold due to critical health status. Please complete maintenance.",
                    "timestamp", System.currentTimeMillis());

            // Send to driver's notification channel
            messagingTemplate.convertAndSend(
                    "/topic/notifications/driver/" + vehicle.getDriver().getId(),
                    (Object) notification);

            System.out.println("Hold notification sent to driver " + vehicle.getDriver().getId());
        } catch (Exception e) {
            System.err.println("Error sending hold notification: " + e.getMessage());
        }
    }

    /**
     * Notify driver that their vehicle has been released from hold
     */
    private void notifyDriverVehicleReleased(Vehicle vehicle) {
        if (messagingTemplate == null || vehicle.getDriver() == null) {
            return;
        }

        try {
            Map<String, Object> notification = Map.of(
                    "type", "VEHICLE_RELEASED",
                    "vehicleId", vehicle.getId(),
                    "vehicleNumber", vehicle.getVehicleNumber(),
                    "holdStatus", vehicle.getHoldStatus(),
                    "releasedAt", vehicle.getReleasedAt().toString(),
                    "message", "Your vehicle has been released from hold. You can now create trips.",
                    "timestamp", System.currentTimeMillis());

            // Send to driver's notification channel
            messagingTemplate.convertAndSend(
                    "/topic/notifications/driver/" + vehicle.getDriver().getId(),
                    (Object) notification);

            System.out.println("Release notification sent to driver " + vehicle.getDriver().getId());
        } catch (Exception e) {
            System.err.println("Error sending release notification: " + e.getMessage());
        }
    }
}
