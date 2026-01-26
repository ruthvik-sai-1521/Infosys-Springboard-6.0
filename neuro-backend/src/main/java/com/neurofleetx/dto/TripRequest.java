package com.neurofleetx.dto;

import lombok.Data;

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
}
