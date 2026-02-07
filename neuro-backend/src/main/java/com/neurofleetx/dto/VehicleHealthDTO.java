package com.neurofleetx.dto;

import com.neurofleetx.model.HealthStatus;
import com.neurofleetx.model.Vehicle;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

@Data
@NoArgsConstructor
public class VehicleHealthDTO {
    // 1. Vehicle Identification
    private Long vehicleId;
    private String vehicleNumber;
    private String vehicleType;

    // 2. Health Parameters
    private Integer engineHealth;
    private Integer transmissionHealth;
    private Integer brakePadHealth;
    private Integer tireHealth;
    private Integer batteryHealth;
    private Double batteryVoltage;
    private Integer oilLevel;
    private Integer coolantLevel;

    // 3. Tire Pressure Details
    private Double tirePressureFL;
    private Double tirePressureFR;
    private Double tirePressureRL;
    private Double tirePressureRR;

    // 4. Mileage Information
    private Integer totalKms;
    private Integer kmsSinceService;
    private Double fuelEfficiency; // km/l

    // 5. Service Information
    private LocalDateTime lastServiceDate;
    private String nextServiceDate; // Stored as String YYYY-MM-DD
    private Long daysUntilService;

    // 6. Overall Health Status
    private HealthStatus healthStatus;
    private Integer healthScore;
    private LocalDateTime lastHealthCheck;

    // 7. Driver Information
    private Long driverId;
    private String driverName;

    // 8. Active Alerts Count
    private long activeAlertsCount;

    public VehicleHealthDTO(Vehicle vehicle, long activeAlertsCount) {
        this.vehicleId = vehicle.getId();
        this.vehicleNumber = vehicle.getVehicleNumber();
        this.vehicleType = vehicle.getType();

        this.engineHealth = vehicle.getEngineHealth();
        this.transmissionHealth = vehicle.getTransmissionHealth();
        this.brakePadHealth = vehicle.getBrakePadHealth();
        this.tireHealth = vehicle.getTireHealth();
        this.batteryHealth = vehicle.getBatteryHealth();
        this.batteryVoltage = vehicle.getBatteryVoltage();
        this.oilLevel = vehicle.getOilLevel();
        this.coolantLevel = vehicle.getCoolantLevel();

        this.tirePressureFL = vehicle.getTirePressureFL();
        this.tirePressureFR = vehicle.getTirePressureFR();
        this.tirePressureRL = vehicle.getTirePressureRL();
        this.tirePressureRR = vehicle.getTirePressureRR();

        this.totalKms = vehicle.getKmsDriven();
        this.kmsSinceService = vehicle.getKmsSinceLastService();
        this.fuelEfficiency = vehicle.getFuelEfficiency();

        this.lastServiceDate = vehicle.getLastServiceDate();
        this.nextServiceDate = vehicle.getNextServiceDate();
        this.daysUntilService = calculateDaysUntilService(this.nextServiceDate);

        this.healthStatus = vehicle.getHealthStatus();
        this.healthScore = vehicle.getHealthScore();
        this.lastHealthCheck = vehicle.getLastHealthCheck();

        if (vehicle.getDriver() != null) {
            this.driverId = vehicle.getDriver().getId();
            this.driverName = vehicle.getDriver().getUsername();
        }

        this.activeAlertsCount = activeAlertsCount;
    }

    private Long calculateDaysUntilService(String nextServiceDateStr) {
        if (nextServiceDateStr == null || nextServiceDateStr.isEmpty()) {
            return null;
        }
        try {
            LocalDate nextService = LocalDate.parse(nextServiceDateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            return ChronoUnit.DAYS.between(LocalDate.now(), nextService);
        } catch (DateTimeParseException e) {
            // Log error or handle gracefully
            return null;
        }
    }
}
