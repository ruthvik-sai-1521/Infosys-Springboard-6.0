package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "trips")
public class Trip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String source;
    private String destination;

    @Column(name = "trip_date")
    private LocalDateTime tripDate;

    @Column(name = "available_seats")
    private Integer availableSeats;

    @Column(name = "estimated_reaching_time")
    private String estimatedReachingTime; // e.g. "5 hours" or "08:00 PM"

    private Double fare;

    @Column(name = "pickup_points", columnDefinition = "TEXT")
    private String pickupPoints; // Comma separated or JSON

    @Column(name = "drop_points", columnDefinition = "TEXT")
    private String dropPoints; // Comma separated or JSON

    @Column(name = "total_km")
    private Double totalKm;

    // SCHEDULED, IN_PROGRESS, COMPLETED, AUTO_COMPLETED, CANCELLED
    private String status;

    // Trip execution tracking
    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "estimated_duration")
    private Integer estimatedDuration; // in minutes

    @Column(name = "auto_end_time")
    private LocalDateTime autoEndTime; // calculated: tripDate + estimatedDuration

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
}
