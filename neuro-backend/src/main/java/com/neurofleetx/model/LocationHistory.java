package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "location_history", indexes = {
        @Index(name = "idx_vehicle_recorded", columnList = "vehicle_id, recorded_at"),
        @Index(name = "idx_expires_at", columnList = "expires_at")
})
public class LocationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "trip_id")
    private Long tripId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column
    private Double speed = 0.0; // km/h

    @Column
    private Double heading = 0.0; // compass heading 0-360

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "event_type")
    private String eventType; // START, STOP, WAYPOINT, END

    @ManyToOne
    @JoinColumn(name = "vehicle_id", insertable = false, updatable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "trip_id", insertable = false, updatable = false)
    private Trip trip;

    /**
     * Automatically set recordedAt timestamp and calculate expiresAt (90 days TTL)
     */
    @PrePersist
    public void setExpirationDate() {
        this.recordedAt = LocalDateTime.now();
        this.expiresAt = this.recordedAt.plusDays(90); // 90-day TTL
    }
}
