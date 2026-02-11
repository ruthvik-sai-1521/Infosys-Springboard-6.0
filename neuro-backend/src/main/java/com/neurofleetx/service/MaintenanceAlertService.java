package com.neurofleetx.service;

import com.neurofleetx.dto.AlertDTO;
import com.neurofleetx.model.MaintenanceAlert;
import com.neurofleetx.model.Vehicle;

import com.neurofleetx.repository.MaintenanceAlertRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MaintenanceAlertService {

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private VehicleHealthService healthService;

    @Autowired
    private VehicleRepository vehicleRepository;

    // 1. Static Threshold Configurations
    private static final Map<String, Map<String, Double>> PREDEFINED_THRESHOLDS = new HashMap<>();

    static {
        // Component -> { "WARNING": val, "CRITICAL": val }
        // For items where LOWER is worse
        Map<String, Double> engine = new HashMap<>();
        engine.put("WARNING", 85.0);
        engine.put("CRITICAL", 70.0);
        PREDEFINED_THRESHOLDS.put("ENGINE_HEALTH", engine);

        Map<String, Double> tires = new HashMap<>();
        tires.put("WARNING", 80.0);
        tires.put("CRITICAL", 60.0);
        PREDEFINED_THRESHOLDS.put("TIRE_HEALTH", tires);

        Map<String, Double> battery = new HashMap<>();
        battery.put("WARNING", 75.0);
        battery.put("CRITICAL", 50.0);
        PREDEFINED_THRESHOLDS.put("BATTERY_HEALTH", battery);

        Map<String, Double> brake = new HashMap<>();
        brake.put("WARNING", 80.0);
        brake.put("CRITICAL", 60.0);
        PREDEFINED_THRESHOLDS.put("BRAKE_PAD_HEALTH", brake);

        Map<String, Double> oil = new HashMap<>();
        oil.put("WARNING", 40.0);
        oil.put("CRITICAL", 20.0);
        PREDEFINED_THRESHOLDS.put("OIL_LEVEL", oil);

        Map<String, Double> coolant = new HashMap<>();
        coolant.put("WARNING", 40.0);
        coolant.put("CRITICAL", 20.0);
        PREDEFINED_THRESHOLDS.put("COOLANT_LEVEL", coolant);

        Map<String, Double> trans = new HashMap<>();
        trans.put("WARNING", 85.0);
        trans.put("CRITICAL", 70.0);
        PREDEFINED_THRESHOLDS.put("TRANSMISSION_HEALTH", trans);
    }

    /**
     * Check thresholds and create alerts for a vehicle
     */
    @Transactional
    public void checkAndCreateAlerts(Vehicle vehicle) {
        checkComponentHealth(vehicle, "ENGINE_HEALTH", vehicle.getEngineHealth());
        checkComponentHealth(vehicle, "TIRE_HEALTH", vehicle.getTireHealth());
        checkComponentHealth(vehicle, "BATTERY_HEALTH", vehicle.getBatteryHealth());
        checkComponentHealth(vehicle, "BRAKE_PAD_HEALTH", vehicle.getBrakePadHealth());
        checkComponentHealth(vehicle, "OIL_LEVEL", vehicle.getOilLevel());
        checkComponentHealth(vehicle, "COOLANT_LEVEL", vehicle.getCoolantLevel());
        checkComponentHealth(vehicle, "TRANSMISSION_HEALTH", vehicle.getTransmissionHealth());

        // Tire pressure checks
        checkTirePressure(vehicle, "TIRE_PRESSURE_FL", vehicle.getTirePressureFL());
        checkTirePressure(vehicle, "TIRE_PRESSURE_FR", vehicle.getTirePressureFR());
        checkTirePressure(vehicle, "TIRE_PRESSURE_RL", vehicle.getTirePressureRL());
        checkTirePressure(vehicle, "TIRE_PRESSURE_RR", vehicle.getTirePressureRR());

        // Service Checks
        if (vehicle.getKmsSinceLastService() != null && vehicle.getKmsSinceLastService() > 10000) {
            createAlertIfNotExists(vehicle, "SERVICE_DUE", MaintenanceAlert.AlertSeverity.HIGH,
                    "Service Overdue", "Kms since service > 10000",
                    vehicle.getKmsSinceLastService() + " km", "10000 km");
        }
    }

    private void checkComponentHealth(Vehicle vehicle, String component, Integer value) {
        if (value == null)
            return;
        Map<String, Double> thresholds = PREDEFINED_THRESHOLDS.get(component);
        if (thresholds == null)
            return;

        if (value < thresholds.get("CRITICAL")) {
            createAlertIfNotExists(vehicle, component, MaintenanceAlert.AlertSeverity.CRITICAL,
                    component.replace("_", " ") + " Critical",
                    "Value is critically low", value + "%", thresholds.get("CRITICAL") + "%");
        } else if (value < thresholds.get("WARNING")) {
            createAlertIfNotExists(vehicle, component, MaintenanceAlert.AlertSeverity.MEDIUM,
                    component.replace("_", " ") + " Warning",
                    "Value is low", value + "%", thresholds.get("WARNING") + "%");
        }
    }

    private void checkTirePressure(Vehicle vehicle, String component, Double pressure) {
        if (pressure == null)
            return;
        if (pressure < 28.0) {
            createAlertIfNotExists(vehicle, component, MaintenanceAlert.AlertSeverity.HIGH,
                    "Low Tire Pressure", component + " is low", pressure + " PSI", "32.0 PSI");
        } else if (pressure > 40.0) {
            createAlertIfNotExists(vehicle, component, MaintenanceAlert.AlertSeverity.MEDIUM,
                    "High Tire Pressure", component + " is high", pressure + " PSI", "32.0 PSI");
        }
    }

    /**
     * Create alert only if similar active alert doesn't exist
     */
    @Transactional
    public void createAlertIfNotExists(Vehicle vehicle, String component, MaintenanceAlert.AlertSeverity severity,
            String title, String description, String currentVal, String thresholdVal) {

        boolean exists = alertRepository.existsByVehicleIdAndComponentAndStatus(
                vehicle.getId(), component, MaintenanceAlert.AlertStatus.ACTIVE);

        if (!exists) {
            MaintenanceAlert alert = new MaintenanceAlert();
            alert.setVehicle(vehicle);
            alert.setDriver(vehicle.getDriver());
            alert.setComponent(component);
            alert.setAlertType(MaintenanceAlert.AlertType.THRESHOLD);
            alert.setSeverity(severity);
            alert.setTitle(title);
            alert.setDescription(description);
            alert.setCurrentValue(currentVal);
            alert.setThresholdValue(thresholdVal);
            alert.setStatus(MaintenanceAlert.AlertStatus.ACTIVE);

            MaintenanceAlert savedAlert = alertRepository.save(alert);
            broadcastAlert(savedAlert);
        }
    }

    /**
     * Get all active alerts (excludes RESOLVED alerts)
     */
    public List<AlertDTO> getActiveAlerts() {
        return alertRepository.findAll().stream()
                .filter(alert -> alert.getStatus() != MaintenanceAlert.AlertStatus.RESOLVED)
                .map(AlertDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get alerts for a specific vehicle (excludes RESOLVED alerts)
     */
    public List<AlertDTO> getVehicleAlerts(Long vehicleId) {
        System.out.println("Fetching alerts for vehicle: " + vehicleId);
        List<MaintenanceAlert> alerts = alertRepository.findByVehicleIdAndStatusOrderBySeverityDescCreatedAtDesc(
                vehicleId, MaintenanceAlert.AlertStatus.ACTIVE);
        System.out.println("Found " + alerts.size() + " active alerts for vehicle " + vehicleId);
        return alerts.stream()
                .map(AlertDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Get alerts for driver's vehicles
     */
    public List<AlertDTO> getDriverAlerts(Long driverId) {
        // Combined query assuming we want all status or just active? Usually active or
        // recent.
        // Let's return all for now or filter by status if needed.
        // Providing all sorted by severity/date is best.
        return alertRepository.findByDriverIdAndStatusOrderBySeverityDesc(driverId, MaintenanceAlert.AlertStatus.ACTIVE)
                .stream().map(AlertDTO::new).collect(Collectors.toList());
    }

    /**
     * Acknowledge Alert
     */
    @Transactional
    public AlertDTO acknowledgeAlert(Long alertId, Long userId) {
        MaintenanceAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        alert.setStatus(MaintenanceAlert.AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now());
        userRepository.findById(userId).ifPresent(alert::setAcknowledgedBy);

        MaintenanceAlert saved = alertRepository.save(alert);
        return new AlertDTO(saved);
    }

    /**
     * Resolve Alert
     * When driver resolves MAINTENANCE_COMPLETED alert, metrics are updated to 100%
     */
    @Transactional
    public AlertDTO resolveAlert(Long alertId, Long userId) {
        MaintenanceAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        alert.setStatus(MaintenanceAlert.AlertStatus.RESOLVED);
        alert.setResolvedAt(LocalDateTime.now());
        userRepository.findById(userId).ifPresent(alert::setResolvedBy);

        MaintenanceAlert saved = alertRepository.save(alert);

        // Apply maintenance fixes when driver resolves
        Vehicle vehicle = alert.getVehicle();
        if (vehicle != null && alert.getComponent() != null) {
            // Handle MAINTENANCE_COMPLETED type specially
            if (alert.getAlertType() == MaintenanceAlert.AlertType.MAINTENANCE_COMPLETED) {
                // Component field contains comma-separated list of components
                String[] components = alert.getComponent().split(",");
                System.out.println("Driver resolving MAINTENANCE_COMPLETED for components: " + alert.getComponent());

                for (String comp : components) {
                    fixComponent(vehicle, comp.trim());
                }

                // Resolve related active alerts for these components
                resolveRelatedAlerts(vehicle, java.util.Arrays.asList(components));
            } else {
                // Regular alert - fix single component
                fixComponent(vehicle, alert.getComponent());
            }

            healthService.updateHealthStatus(vehicle);
            vehicleRepository.save(vehicle);

            // Broadcast health update via WebSocket
            broadcastHealthUpdate(vehicle);
        }

        return new AlertDTO(saved);
    }

    /**
     * Resolve related alerts for the given components after driver verification
     */
    private void resolveRelatedAlerts(Vehicle vehicle, java.util.List<String> components) {
        java.util.List<MaintenanceAlert> activeAlerts = alertRepository.findByVehicleIdAndStatus(
                vehicle.getId(), MaintenanceAlert.AlertStatus.ACTIVE);

        for (MaintenanceAlert relatedAlert : activeAlerts) {
            for (String comp : components) {
                String compUpper = comp.trim().toUpperCase();
                if (relatedAlert.getComponent() != null &&
                        (compUpper.equals("FULL_SERVICE") ||
                                relatedAlert.getComponent().toUpperCase().contains(compUpper))) {
                    relatedAlert.setStatus(MaintenanceAlert.AlertStatus.RESOLVED);
                    relatedAlert.setResolvedAt(LocalDateTime.now());
                    relatedAlert.setResolutionNotes("Auto-resolved by driver after manager maintenance verification");
                    alertRepository.save(relatedAlert);
                    System.out.println("Auto-resolved related alert: " + relatedAlert.getTitle());
                    break;
                }
            }
        }
    }

    /**
     * Broadcast health update via WebSocket after metrics change
     */
    private void broadcastHealthUpdate(Vehicle vehicle) {
        if (messagingTemplate != null) {
            try {
                long activeAlertCount = alertRepository.countByVehicleIdAndStatus(
                        vehicle.getId(), MaintenanceAlert.AlertStatus.ACTIVE);

                java.util.Map<String, Object> healthUpdate = new java.util.HashMap<>();
                healthUpdate.put("vehicleId", vehicle.getId());
                healthUpdate.put("vehicleNumber", vehicle.getVehicleNumber());
                healthUpdate.put("healthScore", vehicle.getHealthScore());
                healthUpdate.put("healthStatus", vehicle.getHealthStatus());
                healthUpdate.put("activeAlerts", activeAlertCount);
                healthUpdate.put("timestamp", System.currentTimeMillis());

                messagingTemplate.convertAndSend("/topic/health/vehicle/" + vehicle.getId(), (Object) healthUpdate);
                messagingTemplate.convertAndSend("/topic/health/fleet", (Object) healthUpdate);

                System.out.println("Broadcasted health update for vehicle " + vehicle.getId());
            } catch (Exception e) {
                System.err.println("Error broadcasting health update: " + e.getMessage());
            }
        }
    }

    /**
     * Fix the component by setting its health to 100
     * Supports: FULL_SERVICE, component names with/without suffixes
     */
    private void fixComponent(Vehicle vehicle, String alertComponent) {
        if (alertComponent == null)
            return;

        String upper = alertComponent.toUpperCase().trim();

        // Handle FULL_SERVICE - reset everything
        if (upper.equals("FULL_SERVICE")) {
            vehicle.setEngineHealth(100);
            vehicle.setTireHealth(100);
            vehicle.setBatteryHealth(100);
            vehicle.setBrakePadHealth(100);
            vehicle.setOilLevel(100);
            vehicle.setCoolantLevel(100);
            vehicle.setTransmissionHealth(100);
            vehicle.setTirePressureFL(32.0);
            vehicle.setTirePressureFR(32.0);
            vehicle.setTirePressureRL(32.0);
            vehicle.setTirePressureRR(32.0);
            vehicle.setLastServiceDate(LocalDateTime.now());
            vehicle.setKmsSinceLastService(0);
            System.out.println("Applied FULL_SERVICE maintenance to vehicle " + vehicle.getId());
            return;
        }

        // Handle individual components (with or without _HEALTH suffix)
        if (upper.contains("ENGINE")) {
            vehicle.setEngineHealth(100);
            System.out.println("Fixed ENGINE for vehicle " + vehicle.getId());
        } else if (upper.contains("TIRE")) {
            vehicle.setTireHealth(100);
            vehicle.setTirePressureFL(32.0);
            vehicle.setTirePressureFR(32.0);
            vehicle.setTirePressureRL(32.0);
            vehicle.setTirePressureRR(32.0);
            System.out.println("Fixed TIRES for vehicle " + vehicle.getId());
        } else if (upper.contains("BRAKE")) {
            vehicle.setBrakePadHealth(100);
            System.out.println("Fixed BRAKES for vehicle " + vehicle.getId());
        } else if (upper.contains("BATTERY")) {
            vehicle.setBatteryHealth(100);
            System.out.println("Fixed BATTERY for vehicle " + vehicle.getId());
        } else if (upper.contains("OIL")) {
            vehicle.setOilLevel(100);
            System.out.println("Fixed OIL for vehicle " + vehicle.getId());
        } else if (upper.contains("COOLANT")) {
            vehicle.setCoolantLevel(100);
            System.out.println("Fixed COOLANT for vehicle " + vehicle.getId());
        } else if (upper.contains("TRANSMISSION")) {
            vehicle.setTransmissionHealth(100);
            System.out.println("Fixed TRANSMISSION for vehicle " + vehicle.getId());
        } else {
            System.out.println("Unknown component: " + alertComponent + " for vehicle " + vehicle.getId());
        }
    }

    /**
     * Resolve alerts based on components (e.g. after service)
     */
    @Transactional
    public void resolveAlertsForComponents(Long vehicleId, List<String> components) {
        List<MaintenanceAlert> alerts = alertRepository.findByVehicleIdAndStatus(vehicleId,
                MaintenanceAlert.AlertStatus.ACTIVE);

        for (MaintenanceAlert alert : alerts) {
            boolean shouldResolve = false;

            if (components.contains("FULL_SERVICE")) {
                shouldResolve = true;
            } else {
                // Fuzzy match
                for (String comp : components) {
                    if (alert.getComponent().contains(comp)) {
                        shouldResolve = true;
                        break;
                    }
                    if ("TIRES".equals(comp) && alert.getComponent().contains("TIRE"))
                        shouldResolve = true;
                    if ("BRAKES".equals(comp) && alert.getComponent().contains("BRAKE"))
                        shouldResolve = true;
                    if ("ENGINE".equals(comp) && alert.getComponent().contains("ENGINE"))
                        shouldResolve = true;
                }
            }

            if (shouldResolve) {
                alert.setStatus(MaintenanceAlert.AlertStatus.RESOLVED);
                alert.setResolvedAt(LocalDateTime.now());
                alert.setResolutionNotes("Auto-resolved by maintenance action");
                alertRepository.save(alert);
            }
        }
    }

    /**
     * Broadcast alert via WebSocket
     */
    public void broadcastAlert(MaintenanceAlert alert) {
        if (messagingTemplate == null)
            return;

        AlertDTO dto = new AlertDTO(alert);

        // Broadcast to Managers
        messagingTemplate.convertAndSend("/topic/alerts/all", dto);

        // Broadcast to Driver
        if (alert.getDriver() != null) {
            messagingTemplate.convertAndSend("/topic/alerts/driver/" + alert.getDriver().getId(), dto);
        }

        // Broadcast to Vehicle topic
        if (alert.getVehicle() != null) {
            messagingTemplate.convertAndSend("/topic/alerts/vehicle/" + alert.getVehicle().getId(), dto);
        }
    }
}
