package com.neurofleetx.service;

import com.neurofleetx.dto.TripValidationResult;
import com.neurofleetx.dto.VehicleHealthDTO;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class TripValidationService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleHealthService healthService;

    @Autowired
    private VehicleHoldService vehicleHoldService;

    private static final int CRITICAL_THRESHOLD = 60;
    private static final int WARNING_THRESHOLD = 70;

    /**
     * Validate if trip can proceed without causing critical health
     * Returns validation result with predictions and warnings
     */
    public TripValidationResult validateTrip(Long vehicleId, Double tripDistance) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        // Check if vehicle is on hold
        if (!vehicleHoldService.canCreateTrip(vehicleId)) {
            return new TripValidationResult(
                    false,
                    false,
                    vehicle.getHealthScore(),
                    vehicle.getHealthScore(),
                    "Vehicle is currently on hold for maintenance.",
                    "Please complete maintenance and submit for manager approval before creating trips.");
        }

        // Calculate predicted health after trip
        int currentHealth = vehicle.getHealthScore() != null ? vehicle.getHealthScore() : 100;
        int predictedHealth = calculatePredictedHealth(vehicle, tripDistance);

        // Determine if trip will cause critical status
        boolean willBeCritical = predictedHealth < CRITICAL_THRESHOLD;
        boolean willBeWarning = predictedHealth < WARNING_THRESHOLD;

        // Build validation result
        if (willBeCritical) {
            return new TripValidationResult(
                    true, // Still allow (driver can override with warning)
                    true,
                    currentHealth,
                    predictedHealth,
                    String.format("⚠️ WARNING: This trip will reduce vehicle health to %d%%, entering CRITICAL zone!",
                            predictedHealth),
                    "We strongly recommend completing maintenance before this trip to avoid vehicle breakdown.");
        } else if (willBeWarning) {
            return new TripValidationResult(
                    true,
                    false,
                    currentHealth,
                    predictedHealth,
                    String.format("⚠️ CAUTION: This trip will reduce vehicle health to %d%%.", predictedHealth),
                    "Consider scheduling maintenance soon to maintain vehicle reliability.");
        } else {
            return new TripValidationResult(
                    true,
                    false,
                    currentHealth,
                    predictedHealth,
                    "Trip validation passed. Vehicle health is sufficient.",
                    null);
        }
    }

    /**
     * Calculate predicted health after trip based on distance
     * Uses wear factor calculation from VehicleHealthSimulationService
     */
    private int calculatePredictedHealth(Vehicle vehicle, Double distanceKm) {
        if (distanceKm == null || distanceKm <= 0) {
            return vehicle.getHealthScore();
        }

        // Simulate wear for this trip
        double wearFactor = calculateWearFactor(vehicle);

        // Calculate component degradation
        int currentEngine = vehicle.getEngineHealth() != null ? vehicle.getEngineHealth() : 100;
        int currentTire = vehicle.getTireHealth() != null ? vehicle.getTireHealth() : 100;
        int currentBattery = vehicle.getBatteryHealth() != null ? vehicle.getBatteryHealth() : 100;
        int currentBrake = vehicle.getBrakePadHealth() != null ? vehicle.getBrakePadHealth() : 100;
        int currentOil = vehicle.getOilLevel() != null ? vehicle.getOilLevel() : 100;
        int currentCoolant = vehicle.getCoolantLevel() != null ? vehicle.getCoolantLevel() : 100;
        int currentTransmission = vehicle.getTransmissionHealth() != null ? vehicle.getTransmissionHealth() : 100;

        // Apply wear (same formula as VehicleHealthSimulationService)
        double engineWear = (0.001 + (0.004 * 0.5)) * distanceKm * wearFactor; // Average wear
        double tireWear = (0.002 + (0.004 * 0.5)) * distanceKm * wearFactor;
        double oilConsumption = 0.01 * distanceKm;
        double coolantConsumption = 0.005 * distanceKm;

        // Estimate trip duration (assuming 60 km/h average)
        double durationHours = distanceKm / 60.0;
        double batteryWear = 0.05 * durationHours;

        // Calculate predicted values
        int predictedEngine = (int) Math.max(0, currentEngine - engineWear);
        int predictedTire = (int) Math.max(0, currentTire - tireWear);
        int predictedBattery = (int) Math.max(0, currentBattery - batteryWear);
        int predictedBrake = currentBrake; // Brakes don't degrade much per trip
        int predictedOil = (int) Math.max(0, currentOil - oilConsumption);
        int predictedCoolant = (int) Math.max(0, currentCoolant - coolantConsumption);
        int predictedTransmission = currentTransmission; // Minor degradation

        // Calculate weighted health score (same weights as VehicleHealthService)
        double predictedScore = 0.0;
        predictedScore += predictedEngine * 0.25;
        predictedScore += predictedTire * 0.20;
        predictedScore += predictedBattery * 0.15;
        predictedScore += predictedBrake * 0.15;
        predictedScore += predictedOil * 0.10;
        predictedScore += predictedCoolant * 0.05;
        predictedScore += predictedTransmission * 0.10;

        return (int) Math.round(predictedScore);
    }

    /**
     * Calculate wear factor based on vehicle condition
     * Similar to VehicleHealthSimulationService logic
     */
    private double calculateWearFactor(Vehicle vehicle) {
        double factor = 1.0;

        // Older vehicles wear faster
        if (vehicle.getKmsDriven() != null && vehicle.getKmsDriven() > 100000) {
            factor += 0.2;
        }

        // Low oil/coolant accelerates wear
        if (vehicle.getOilLevel() != null && vehicle.getOilLevel() < 30) {
            factor += 0.5;
        }
        if (vehicle.getCoolantLevel() != null && vehicle.getCoolantLevel() < 30) {
            factor += 0.3;
        }

        // Poor overall health accelerates wear
        if (vehicle.getHealthScore() != null && vehicle.getHealthScore() < 70) {
            factor += 0.3;
        }

        return factor;
    }

    /**
     * Get detailed health prediction for UI display
     */
    public VehicleHealthDTO predictHealthAfterTrip(Long vehicleId, Double distance) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        int predicted = calculatePredictedHealth(vehicle, distance);

        // Create a copy of vehicle with predicted health for DTO
        Vehicle predictedVehicle = new Vehicle();
        predictedVehicle.setId(vehicle.getId());
        predictedVehicle.setVehicleNumber(vehicle.getVehicleNumber());
        predictedVehicle.setHealthScore(predicted);

        // Set predicted health status
        if (predicted < 50) {
            predictedVehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.CRITICAL);
        } else if (predicted < 70) {
            predictedVehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.DUE);
        } else if (predicted < 85) {
            predictedVehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.WARNING);
        } else if (predicted < 95) {
            predictedVehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.GOOD);
        } else {
            predictedVehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.HEALTHY);
        }

        return new VehicleHealthDTO(predictedVehicle, 0);
    }
}
