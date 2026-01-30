package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "vehicle_locations", indexes = {
        @Index(name = "idx_trip_timestamp", columnList = "trip_id, timestamp"),
        @Index(name = "idx_vehicle_timestamp", columnList = "vehicle_id, timestamp")
})
public class VehicleLocation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column
    private Double speed = 0.0; // km/h

    @Column
    private Double heading = 0.0; // 0-360 degrees

    @Column
    private Double altitude; // meters

    @Column
    private Double accuracy; // GPS accuracy in meters

    @Column(name = "location_status")
    private String locationStatus = "ACTIVE"; // ACTIVE, IDLE, STOPPED

    @Column
    private LocalDateTime timestamp;

    @Column(name = "is_simulated")
    private Boolean isSimulated = false;

    @Column(name = "simulation_step")
    private Integer simulationStep;

    @Column(name = "distance_traveled")
    private Double distanceTraveled = 0.0; // kilometers

    @Column(name = "fuel_consumed")
    private Double fuelConsumed = 0.0; // liters

    @Column(name = "battery_consumed")
    private Integer batteryConsumed = 0; // percentage

    @ManyToOne
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "driver_id", insertable = false, updatable = false)
    private User driver;

    @ManyToOne
    @JoinColumn(name = "trip_id", insertable = false, updatable = false)
    private Trip trip;

    @PrePersist
    public void setTimestamp() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}
