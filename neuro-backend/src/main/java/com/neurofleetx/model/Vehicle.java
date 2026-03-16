package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "vehicles")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_number")
    private String vehicleNumber;

    @Column(name = "rc_pdf_url", columnDefinition = "TEXT")
    private String rcPdfUrl;

    @Column(name = "insurance_pdf_url", columnDefinition = "TEXT")
    private String insurancePdfUrl;

    @Column(name = "kms_driven")
    private Integer kmsDriven;

    @Column(name = "next_service_date")
    private String nextServiceDate;

    @ElementCollection
    @CollectionTable(name = "vehicle_images", joinColumns = @JoinColumn(name = "vehicle_id"))
    @Column(name = "image_url") // Optional: name the value column
    private java.util.List<String> vehicleImages; // Store URLs

    private String status = "PENDING_ADMIN_APPROVAL";

    private String type; // EV, SEDAN, SUV, HATCHBACK

    @Column(name = "seat_count")
    private Integer seatCount;

    @Column(name = "storage_capacity")
    private String storageCapacity;

    @Column(name = "current_location")
    private String currentLocation; // "lat,lng"

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(name = "fuel_level")
    private Integer fuelLevel; // 0-100 percentage

    @Column(name = "mileage")
    private Double mileage; // km per liter

    @Column(name = "fuel_capacity")
    private Double fuelCapacity; // in liters

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    // Live Tracking Fields
    @Column(name = "last_known_latitude")
    private Double lastKnownLatitude;

    @Column(name = "last_known_longitude")
    private Double lastKnownLongitude;

    @Column(name = "base_latitude")
    private Double baseLatitude;

    @Column(name = "base_longitude")
    private Double baseLongitude;

    @Column(name = "base_address")
    private String baseAddress;

    @Column(name = "vehicle_status")
    private String vehicleStatus = "IDLE"; // IDLE, IN_TRANSIT, MAINTENANCE

    @Column(name = "last_location_update")
    private LocalDateTime lastLocationUpdate;

    // --- Vehicle Hold Status Fields ---
    // Added for automatic hold when health enters critical zone
    @Column(name = "hold_status")
    private String holdStatus = "ACTIVE"; // ACTIVE, ON_HOLD, PENDING_RELEASE

    @Column(name = "hold_reason")
    private String holdReason;

    @Column(name = "held_at")
    private LocalDateTime heldAt;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    // --- Health Monitoring Fields ---

    @Column(name = "engine_health")
    private Integer engineHealth = 100;

    @Column(name = "transmission_health")
    private Integer transmissionHealth = 100;

    @Column(name = "brake_pad_health")
    private Integer brakePadHealth = 100;

    @Column(name = "tire_health")
    private Integer tireHealth = 100;

    @Column(name = "tire_pressure_fl")
    private Double tirePressureFL = 32.0;

    @Column(name = "tire_pressure_fr")
    private Double tirePressureFR = 32.0;

    @Column(name = "tire_pressure_rl")
    private Double tirePressureRL = 32.0;

    @Column(name = "tire_pressure_rr")
    private Double tirePressureRR = 32.0;

    @Column(name = "battery_health")
    private Integer batteryHealth = 100;

    @Column(name = "battery_voltage")
    private Double batteryVoltage = 12.6;

    @Column(name = "oil_level")
    private Integer oilLevel = 100;

    @Column(name = "coolant_level")
    private Integer coolantLevel = 100;

    @Column(name = "kms_since_last_service")
    private Integer kmsSinceLastService = 0;

    @Column(name = "last_service_date")
    private LocalDateTime lastServiceDate;

    @Column(name = "last_health_check")
    private LocalDateTime lastHealthCheck;

    @Column(name = "health_status")
    @Enumerated(EnumType.STRING)
    private HealthStatus healthStatus = HealthStatus.HEALTHY;

    @Column(name = "health_score")
    private Integer healthScore = 100;

    @Column(name = "fuel_efficiency")
    private Double fuelEfficiency; // km/l or equivalent

    /**
     * Automatically set seat count based on vehicle type before persisting
     */
    @PrePersist
    @PreUpdate
    public void setSeatCountFromType() {
        if (this.seatCount == null && this.type != null) {
            String vehicleType = this.type.toUpperCase();
            switch (vehicleType) {
                case "SUV":
                    this.seatCount = 7; // Updated default for SUV
                    break;
                case "SEDAN":
                    this.seatCount = 5;
                    break;
                case "HATCHBACK":
                    this.seatCount = 5;
                    break;
                case "EV":
                    this.seatCount = 5;
                    break;
                default:
                    this.seatCount = 4;
                    break;
            }
        }
    }
}