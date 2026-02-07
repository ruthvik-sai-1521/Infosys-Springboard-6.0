package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_health_history")
@Data
@NoArgsConstructor
public class VehicleHealthHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    // --- Metrics Snapshot ---

    @Column(name = "engine_health")
    private Integer engineHealth;

    @Column(name = "transmission_health")
    private Integer transmissionHealth;

    @Column(name = "brake_pad_health")
    private Integer brakePadHealth;

    @Column(name = "tire_health")
    private Integer tireHealth;

    // Tire Pressures
    @Column(name = "tire_pressure_fl")
    private Double tirePressureFL;

    @Column(name = "tire_pressure_fr")
    private Double tirePressureFR;

    @Column(name = "tire_pressure_rl")
    private Double tirePressureRL;

    @Column(name = "tire_pressure_rr")
    private Double tirePressureRR;

    @Column(name = "battery_health")
    private Integer batteryHealth;

    @Column(name = "battery_voltage")
    private Double batteryVoltage;

    @Column(name = "oil_level")
    private Integer oilLevel;

    @Column(name = "coolant_level")
    private Integer coolantLevel;

    // --- Context ---

    @Column(name = "total_kms_driven")
    private Integer totalKmsDriven; // Snapshot of vehicle's kmsDriven

    @Column(name = "health_score")
    private Integer healthScore;

    @Column(name = "health_status")
    @Enumerated(EnumType.STRING)
    private HealthStatus healthStatus;

    /**
     * Constructor to create a snapshot from a Vehicle object
     */
    public VehicleHealthHistory(Vehicle vehicle, Trip trip) {
        this.vehicle = vehicle;
        this.trip = trip;
        this.recordedAt = LocalDateTime.now();

        // Snapshot health metrics
        this.engineHealth = vehicle.getEngineHealth();
        this.transmissionHealth = vehicle.getTransmissionHealth();
        this.brakePadHealth = vehicle.getBrakePadHealth();
        this.tireHealth = vehicle.getTireHealth();

        this.tirePressureFL = vehicle.getTirePressureFL();
        this.tirePressureFR = vehicle.getTirePressureFR();
        this.tirePressureRL = vehicle.getTirePressureRL();
        this.tirePressureRR = vehicle.getTirePressureRR();

        this.batteryHealth = vehicle.getBatteryHealth();
        this.batteryVoltage = vehicle.getBatteryVoltage();

        this.oilLevel = vehicle.getOilLevel();
        this.coolantLevel = vehicle.getCoolantLevel();

        // Snapshot context
        this.totalKmsDriven = vehicle.getKmsDriven();
        this.healthScore = vehicle.getHealthScore();
        this.healthStatus = vehicle.getHealthStatus();
    }
}
