package com.neurofleetx.config;

import com.neurofleetx.model.User;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private com.neurofleetx.repository.VehicleRepository vehicleRepository;
    @Autowired
    private com.neurofleetx.repository.VehicleHealthHistoryRepository healthHistoryRepository;
    @Autowired
    private com.neurofleetx.repository.MaintenanceAlertRepository alertRepository;

    @Override
    public void run(String... args) throws Exception {
        // Check if admin exists
        if (userRepository.findByEmail("fleetxadmin@gmail.com").isEmpty()) {
            User admin = new User();
            admin.setUsername("AdminFleetX");
            admin.setEmail("fleetxadmin@gmail.com");
            admin.setPassword(passwordEncoder.encode("admin@1234"));
            admin.setRole("ADMIN");
            admin.setVerificationStatus("APPROVED");
            userRepository.save(admin);
            System.out.println("DEFAULT ADMIN CREATED: fleetxadmin@gmail.com / admin@1234");
        }

        seedHealthData();
    }

    private void seedHealthData() {
        if (healthHistoryRepository.count() > 0) {
            return; // Data already exists
        }

        System.out.println("Seeding Vehicle Health Data...");
        java.util.List<com.neurofleetx.model.Vehicle> vehicles = vehicleRepository.findAll();
        java.util.Random random = new java.util.Random();

        for (int i = 0; i < vehicles.size(); i++) {
            com.neurofleetx.model.Vehicle vehicle = vehicles.get(i);

            // Determine scenario based on index to ensure variety
            String scenario = "HEALTHY";
            if (i % 10 == 0)
                scenario = "CRITICAL"; // 1 in 10 is critical
            else if (i % 5 == 0)
                scenario = "WARNING"; // 1 in 5 is warning
            else if (i % 7 == 0)
                scenario = "SERVICE_DUE";

            // Set metrics based on scenario
            vehicle.setLastHealthCheck(LocalDateTime.now());

            if (scenario.equals("CRITICAL")) {
                vehicle.setEngineHealth((int) (30.0 + random.nextDouble() * 10)); // 30-40
                vehicle.setTireHealth((int) (40.0 + random.nextDouble() * 20));
                vehicle.setBatteryHealth((int) (50.0 + random.nextDouble() * 20));
                vehicle.setBrakePadHealth((int) (20.0 + random.nextDouble() * 10)); // Low brakes
                vehicle.setOilLevel((int) (30.0 + random.nextDouble() * 10));
                vehicle.setHealthScore(35);
                vehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.CRITICAL);

                // Add Critical Alert
                createAlert(vehicle, "Critical Brake Wear",
                        "Brake pads are critically low (< 30%). Immediate replacement required.",
                        com.neurofleetx.model.MaintenanceAlert.AlertSeverity.CRITICAL);
                createAlert(vehicle, "Engine Misfire Detected", "Engine health is critical. Check engine light is on.",
                        com.neurofleetx.model.MaintenanceAlert.AlertSeverity.CRITICAL);
            } else if (scenario.equals("WARNING")) {
                vehicle.setEngineHealth((int) (70.0 + random.nextDouble() * 10));
                vehicle.setTireHealth((int) (45.0 + random.nextDouble() * 10)); // Low tires
                vehicle.setBatteryHealth((int) (80.0 + random.nextDouble() * 20));
                vehicle.setBrakePadHealth((int) (60.0 + random.nextDouble() * 20));
                vehicle.setOilLevel((int) (50.0 + random.nextDouble() * 20));
                vehicle.setHealthScore(55);
                vehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.WARNING);

                createAlert(vehicle, "Low Tire Pressure", "Tire health is degrading. Check pressure and tread depth.",
                        com.neurofleetx.model.MaintenanceAlert.AlertSeverity.HIGH);
            } else if (scenario.equals("SERVICE_DUE")) {
                vehicle.setEngineHealth((int) (80.0 + random.nextDouble() * 10));
                vehicle.setTireHealth((int) (80.0 + random.nextDouble() * 10));
                vehicle.setBatteryHealth(90);
                vehicle.setBrakePadHealth(70);
                vehicle.setOilLevel(40); // Low oil
                vehicle.setHealthScore(75);
                vehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.DUE);
                vehicle.setNextServiceDate(LocalDate.now().minusDays(5).toString());

                createAlert(vehicle, "Service Overdue", "Scheduled maintenance was due 5 days ago.",
                        com.neurofleetx.model.MaintenanceAlert.AlertSeverity.MEDIUM);
            } else {
                // Healthy
                vehicle.setEngineHealth((int) (90.0 + random.nextDouble() * 10));
                vehicle.setTireHealth((int) (85.0 + random.nextDouble() * 15));
                vehicle.setBatteryHealth((int) (90.0 + random.nextDouble() * 10));
                vehicle.setBrakePadHealth((int) (85.0 + random.nextDouble() * 15));
                vehicle.setOilLevel((int) (80.0 + random.nextDouble() * 20));
                vehicle.setHealthScore((int) (90.0 + random.nextDouble() * 10));
                vehicle.setHealthStatus(com.neurofleetx.model.HealthStatus.HEALTHY);
                vehicle.setNextServiceDate(LocalDate.now().plusMonths(3).toString());
            }

            // Random fluctuations
            vehicle.setCoolantLevel((int) (70.0 + random.nextDouble() * 30));
            vehicle.setTransmissionHealth((int) (80.0 + random.nextDouble() * 20));

            vehicleRepository.save(vehicle);

            // Generate 30 days of history
            generateHistory(vehicle, vehicle.getHealthStatus());
        }
        System.out.println("Health Data Seeding Completed!");
    }

    private void createAlert(com.neurofleetx.model.Vehicle vehicle, String title, String desc,
            com.neurofleetx.model.MaintenanceAlert.AlertSeverity severity) {
        com.neurofleetx.model.MaintenanceAlert alert = new com.neurofleetx.model.MaintenanceAlert();
        alert.setVehicle(vehicle);
        alert.setDriver(vehicle.getDriver()); // Associate with driver
        alert.setAlertType(com.neurofleetx.model.MaintenanceAlert.AlertType.THRESHOLD);
        alert.setComponent("HEALTH_CHECK"); // Set a default component
        alert.setTitle(title);
        alert.setDescription(desc);
        alert.setSeverity(severity);
        alert.setStatus(com.neurofleetx.model.MaintenanceAlert.AlertStatus.ACTIVE);
        alert.setCreatedAt(java.time.LocalDateTime.now());
        alertRepository.save(alert);
    }

    private void generateHistory(com.neurofleetx.model.Vehicle vehicle,
            com.neurofleetx.model.HealthStatus currentStatus) {
        java.util.Random random = new java.util.Random();
        double baseScore = currentStatus == com.neurofleetx.model.HealthStatus.CRITICAL ? 40
                : currentStatus == com.neurofleetx.model.HealthStatus.WARNING ? 60 : 90;

        for (int i = 30; i >= 0; i--) {
            com.neurofleetx.model.VehicleHealthHistory history = new com.neurofleetx.model.VehicleHealthHistory();
            history.setVehicle(vehicle);
            history.setRecordedAt(LocalDateTime.now().minusDays(i));

            // Trend: slightly better in the past, degrading over time
            double dailyFluctuation = (random.nextDouble() * 4) - 2; // +/- 2
            double trend = i * 0.2; // 0.2 per day degradation

            double score = baseScore + trend + dailyFluctuation;
            score = Math.min(100, Math.max(0, score)); // Clamp 0-100

            history.setHealthScore((int) score);
            history.setEngineHealth((int) Math.min(100, score + (random.nextDouble() * 5)));
            history.setTireHealth((int) Math.min(100, score - (random.nextDouble() * 5)));
            history.setBatteryHealth((int) (90.0 + (random.nextDouble() * 10) - (i * 0.1)));

            // Set other required fields to avoid null constraints if any (assuming nullable
            // based on entity def but good to be safe)
            history.setBrakePadHealth((int) (score));
            history.setOilLevel((int) (score));
            history.setCoolantLevel((int) (score));
            history.setTransmissionHealth((int) (score));

            healthHistoryRepository.save(history);
        }
    }
}
