package com.neurofleetx.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TripRequest {
    private String source;
    private String destination;
    private String tripDate; // ISO format string
    private Integer availableSeats;
    private Double fare;
    private String pickupPoints;
    private String dropPoints;
    private Double totalKm;
    private Long driverId;
    private Long vehicleId;
    private Integer estimatedDuration; // in minutes

    // Helper method to convert string date to LocalDateTime
    public LocalDateTime getTripDate() {
        if (tripDate != null) {
            return LocalDateTime.parse(tripDate);
        }
        return null;
    }
}
