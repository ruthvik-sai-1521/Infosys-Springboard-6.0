package com.neurofleetx.service;

import com.neurofleetx.model.*;
import com.neurofleetx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class VehicleHealthSimulationService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private MaintenanceAlertService alertService;

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    @Autowired
    private MaintenanceThresholdRepository thresholdRepository; // Needed for alert checks

    @Autowired
    private VehicleHealthService healthService;

    private final Random random = new Random();

    /**
     * Simulate realistic wear during trips
     */
    @Async
    @Transactional
    public void simulateTripWear(Long vehicleId, Double distanceKm, Double durationHours) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle == null)
            return;

        double wearFactor = calculateWearFactor(vehicle, distanceKm);

        // 1. Engine Wear (0.001-0.005% per km)
        double engineWear = (0.001 + (random.nextDouble() * 0.004)) * distanceKm * wearFactor;
        if (vehicle.getEngineHealth() != null) {
            vehicle.setEngineHealth((int) Math.max(0, vehicle.getEngineHealth() - engineWear));
        }

        // 2. Tire Wear (0.002-0.006% per km)
        double tireWear = (0.002 + (random.nextDouble() * 0.004)) * distanceKm * wearFactor;
        if (vehicle.getTireHealth() != null) {
            vehicle.setTireHealth((int) Math.max(0, vehicle.getTireHealth() - tireWear));
        }

        // 3. Tire Pressure Fluctuation (-0.1 to +0.05 PSI per trip)
        double pressureChange = -0.1 + (random.nextDouble() * 0.15);
        updateTirePressures(vehicle, pressureChange);

        // 4. Battery Wear (0.0005% per hour)
        if (durationHours > 0) {
            double batteryWear = 0.0005 * durationHours * 100; // *100 for percentage scale? Assuming percentage field.
            // Actually battery health is 0-100. 0.0005% is very small. Let's say 0.05 per
            // hour.
            double batteryWearVal = 0.05 * durationHours;
            if (vehicle.getBatteryHealth() != null) {
                vehicle.setBatteryHealth((int) Math.max(0, vehicle.getBatteryHealth() - batteryWearVal));
            }
        }

        // 5. Oil Consumption (0.01% per km)
        double oilConsumption = 0.01 * distanceKm;
        if (vehicle.getOilLevel() != null) {
            vehicle.setOilLevel((int) Math.max(0, vehicle.getOilLevel() - oilConsumption));
        }

        // 6. Coolant Consumption (0.005% per km)
        double coolantConsumption = 0.005 * distanceKm;
        if (vehicle.getCoolantLevel() != null) {
            vehicle.setCoolantLevel((int) Math.max(0, vehicle.getCoolantLevel() - coolantConsumption));
        }

        // 7. Brake Wear (0.001-0.003% per km)
        double brakeWear = (0.001 + (random.nextDouble() * 0.002)) * distanceKm * wearFactor;
        if (vehicle.getBrakePadHealth() != null) {
            vehicle.setBrakePadHealth((int) Math.max(0, vehicle.getBrakePadHealth() - brakeWear));
        }

        // Recalculate Health
        healthService.updateHealthStatus(vehicle);
    }

    private void updateTirePressures(Vehicle vehicle, double change) {
        if (vehicle.getTirePressureFL() != null)
            vehicle.setTirePressureFL(Math.max(20, vehicle.getTirePressureFL() + change));
        if (vehicle.getTirePressureFR() != null)
            vehicle.setTirePressureFR(Math.max(20, vehicle.getTirePressureFR() + change));
        if (vehicle.getTirePressureRL() != null)
            vehicle.setTirePressureRL(Math.max(20, vehicle.getTirePressureRL() + change));
        if (vehicle.getTirePressureRR() != null)
            vehicle.setTirePressureRR(Math.max(20, vehicle.getTirePressureRR() + change));
    }

    /**
     * Calculate wear factor based on vehicle condition
     */
    public double calculateWearFactor(Vehicle vehicle, Double distance) {
        double factor = 1.0;

        // Older vehicles (more kms) wear faster
        if (vehicle.getKmsDriven() != null && vehicle.getKmsDriven() > 100000) {
            factor += 0.2; // 20% faster wear
        }

        // Low oil/coolant accelerates wear
        if (vehicle.getOilLevel() != null && vehicle.getOilLevel() < 30) {
            factor += 0.5;
        }
        if (vehicle.getCoolantLevel() != null && vehicle.getCoolantLevel() < 30) {
            factor += 0.3;
        }

        return factor;
    }

    /**
     * Daily scheduled task to simulate idle wear and check health
     */
    @Scheduled(cron = "0 0 6 * * ?") // 6 AM daily
    @Transactional
    public void performDailyHealthCheck() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        for (Vehicle vehicle : vehicles) {
            // Idle Wear
            // Battery drain (approx 0.5% per day if not used? Let's say 1%)
            if (vehicle.getBatteryHealth() != null) {
                vehicle.setBatteryHealth(Math.max(0, vehicle.getBatteryHealth() - 1));
            }

            // Tire pressure drop (natural leakage, e.g., 0.05 PSI per day)
            updateTirePressures(vehicle, -0.05);

            // Update status
            healthService.updateHealthStatus(vehicle);

            // Record Snapshot
            healthService.recordHealthSnapshot(vehicle.getId(), null);

            // Check Alerts (Simple threshold check here or reuse logic from
            // SimulationService)
            checkHealthAndGenerateAlerts(vehicle);
        }
    }

    private void checkHealthAndGenerateAlerts(Vehicle vehicle) {
        // Reuse similar logic from VehicleSimulationService or delegate
        // Ideally this should be centralized. For now, implementing basic check.
        try {
            List<MaintenanceThreshold> thresholds = thresholdRepository.findByIsActiveTrue();
            for (MaintenanceThreshold threshold : thresholds) {
                Double val = getComponentValue(vehicle, threshold.getComponentName());
                if (val != null && threshold.getWarningThreshold() != null) {
                    // Check logic (simplified for daily check)
                    boolean breach = false;
                    String severity = "MEDIUM";
                    if ("BELOW".equals(threshold.getCheckType()) && val < threshold.getWarningThreshold()) {
                        breach = true;
                        if (threshold.getCriticalThreshold() != null && val < threshold.getCriticalThreshold())
                            severity = "CRITICAL";
                    } else if ("ABOVE".equals(threshold.getCheckType()) && val > threshold.getWarningThreshold()) {
                        breach = true;
                        if (threshold.getCriticalThreshold() != null && val > threshold.getCriticalThreshold())
                            severity = "CRITICAL";
                    }

                    if (breach) {
                        createAlert(vehicle, threshold.getComponentName(), severity,
                                threshold.getDescription() + " (" + val + ")");
                    }
                }
            }
        } catch (Exception e) {
            // Log error
        }
    }

    private Double getComponentValue(Vehicle vehicle, String component) {
        // ... same switch case as SimulationIntegration ...
        switch (component) {
            case "ENGINE_HEALTH":
                return vehicle.getEngineHealth() != null ? vehicle.getEngineHealth().doubleValue() : null;
            case "TIRE_HEALTH":
                return vehicle.getTireHealth() != null ? vehicle.getTireHealth().doubleValue() : null;
            case "BATTERY_HEALTH":
                return vehicle.getBatteryHealth() != null ? vehicle.getBatteryHealth().doubleValue() : null;
            case "OIL_LEVEL":
                return vehicle.getOilLevel() != null ? vehicle.getOilLevel().doubleValue() : null;
            // Add others
            default:
                return null;
        }
    }

    private void createAlert(Vehicle vehicle, String component, String severity, String description) {
        // Check duplication
        if (!alertRepository.existsByVehicleIdAndComponentAndStatus(vehicle.getId(), component,
                MaintenanceAlert.AlertStatus.ACTIVE)) {
            MaintenanceAlert alert = new MaintenanceAlert();
            alert.setVehicle(vehicle);
            alert.setComponent(component);
            alert.setAlertType(MaintenanceAlert.AlertType.THRESHOLD);
            alert.setTitle(severity + ": " + component);
            alert.setDescription(description);
            alert.setStatus(MaintenanceAlert.AlertStatus.ACTIVE);
            try {
                alert.setSeverity(MaintenanceAlert.AlertSeverity.valueOf(severity));
            } catch (Exception e) {
                alert.setSeverity(MaintenanceAlert.AlertSeverity.MEDIUM);
            }
            alertRepository.save(alert);
        }
    }

    /**
     * Perform maintenance on vehicle
     */
    @Transactional
    public void performMaintenance(Long vehicleId, List<String> components) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        if (components.contains("FULL_SERVICE")) {
            vehicle.setEngineHealth(100);
            vehicle.setTireHealth(100);
            vehicle.setBatteryHealth(100);
            vehicle.setBrakePadHealth(100);
            vehicle.setOilLevel(100);
            vehicle.setCoolantLevel(100);
            vehicle.setTransmissionHealth(100);
            vehicle.setTirePressureFL(32.0); // Reset to standard
            vehicle.setTirePressureFR(32.0);
            vehicle.setTirePressureRL(32.0);
            vehicle.setTirePressureRR(32.0);

            vehicle.setLastServiceDate(LocalDateTime.now());
            vehicle.setKmsSinceLastService(0);
            // Reset next service date + 6 months
            vehicle.setNextServiceDate(java.time.LocalDate.now().plusMonths(6).toString());

            // Resolve all alerts
            resolveVehicleAlerts(vehicle, "FULL_SERVICE");

        } else {
            for (String component : components) {
                switch (component) {
                    case "ENGINE":
                        vehicle.setEngineHealth(100);
                        break;
                    case "TIRES":
                        vehicle.setTireHealth(100);
                        vehicle.setTirePressureFL(32.0);
                        vehicle.setTirePressureFR(32.0);
                        vehicle.setTirePressureRL(32.0);
                        vehicle.setTirePressureRR(32.0);
                        break;
                    case "BATTERY":
                        vehicle.setBatteryHealth(100);
                        break;
                    case "BRAKES":
                        vehicle.setBrakePadHealth(100);
                        break;
                    case "OIL":
                        vehicle.setOilLevel(100);
                        break;
                    case "COOLANT":
                        vehicle.setCoolantLevel(100);
                        break;
                    case "TRANSMISSION":
                        vehicle.setTransmissionHealth(100);
                        break;
                    default:
                        System.out.println("Unknown component for maintenance: " + component);
                        break;
                }
                resolveVehicleAlerts(vehicle, component);
            }
        }

        healthService.updateHealthStatus(vehicle);

        // NEW: Create notification alert for driver
        if (vehicle.getDriver() != null) {
            String componentsList = String.join(", ", components);
            String message = components.contains("FULL_SERVICE")
                    ? "Full service maintenance completed. Please verify vehicle condition."
                    : "Maintenance performed on: " + componentsList + ". Please verify and resolve.";

            MaintenanceAlert notification = new MaintenanceAlert();
            notification.setVehicle(vehicle);
            notification.setAlertType(MaintenanceAlert.AlertType.MAINTENANCE_COMPLETED);
            notification.setSeverity(MaintenanceAlert.AlertSeverity.LOW);
            notification.setComponent("MAINTENANCE_NOTIFICATION");
            notification.setTitle("Maintenance Completed");
            notification.setDescription(message);
            notification.setStatus(MaintenanceAlert.AlertStatus.ACTIVE);
            notification.setCreatedAt(LocalDateTime.now());

            alertRepository.save(notification);
        }
    }

    private void resolveVehicleAlerts(Vehicle vehicle, String component) {
        List<MaintenanceAlert> alerts = alertRepository.findByVehicleIdAndStatus(vehicle.getId(),
                MaintenanceAlert.AlertStatus.ACTIVE);
        for (MaintenanceAlert alert : alerts) {
            if ("FULL_SERVICE".equals(component)
                    || (alert.getComponent() != null && component.contains(alert.getComponent().split("_")[0]))) { // fuzzy
                                                                                                                   // match
                                                                                                                   // e.g.
                                                                                                                   // ENGINE
                                                                                                                   // matches
                                                                                                                   // ENGINE_HEALTH
                alert.setStatus(MaintenanceAlert.AlertStatus.RESOLVED);
                alert.setResolvedAt(LocalDateTime.now());
                alert.setResolutionNotes("Auto-resolved by maintenance: " + component);
                alertRepository.save(alert);
            }
        }
    }

    /**
     * Apply realistic wear to vehicle components based on trip distance
     * Degradation rates are per 1000 km (realistic values based on typical vehicle
     * wear)
     */
    @Transactional
    public void applyTripWear(Vehicle vehicle, int distanceKm) {
        if (distanceKm <= 0)
            return;

        // Degradation rates per 1000 km (realistic values)
        double engineDegradation = 0.5; // 0.5% per 1000 km
        double tireDegradation = 0.8; // 0.8% per 1000 km (tires wear faster)
        double brakeDegradation = 0.6; // 0.6% per 1000 km
        double batteryDegradation = 0.3; // 0.3% per 1000 km
        double oilDegradation = 1.0; // 1.0% per 1000 km (oil degrades faster)
        double coolantDegradation = 0.4; // 0.4% per 1000 km
        double transmissionDegradation = 0.4; // 0.4% per 1000 km

        double factor = distanceKm / 1000.0;

        // Apply degradation (ensure minimum of 0)
        vehicle.setEngineHealth(Math.max(0, vehicle.getEngineHealth() - (int) (engineDegradation * factor)));
        vehicle.setTireHealth(Math.max(0, vehicle.getTireHealth() - (int) (tireDegradation * factor)));
        vehicle.setBrakePadHealth(Math.max(0, vehicle.getBrakePadHealth() - (int) (brakeDegradation * factor)));
        vehicle.setBatteryHealth(Math.max(0, vehicle.getBatteryHealth() - (int) (batteryDegradation * factor)));
        vehicle.setOilLevel(Math.max(0, vehicle.getOilLevel() - (int) (oilDegradation * factor)));
        vehicle.setCoolantLevel(Math.max(0, vehicle.getCoolantLevel() - (int) (coolantDegradation * factor)));
        vehicle.setTransmissionHealth(
                Math.max(0, vehicle.getTransmissionHealth() - (int) (transmissionDegradation * factor)));

        // Slightly reduce tire pressure (realistic: 0.1 PSI per 1000 km)
        double tirePressureLoss = 0.1 * factor;
        vehicle.setTirePressureFL(Math.max(20.0, vehicle.getTirePressureFL() - tirePressureLoss));
        vehicle.setTirePressureFR(Math.max(20.0, vehicle.getTirePressureFR() - tirePressureLoss));
        vehicle.setTirePressureRL(Math.max(20.0, vehicle.getTirePressureRL() - tirePressureLoss));
        vehicle.setTirePressureRR(Math.max(20.0, vehicle.getTirePressureRR() - tirePressureLoss));

        vehicleRepository.save(vehicle);
    }
}
