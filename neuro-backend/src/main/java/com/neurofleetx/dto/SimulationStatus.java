package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationStatus {
    private Long vehicleId;
    private Long driverId;
    private Long tripId;
    private String status; // RUNNING, STOPPED, PAUSED
    private Integer currentIndex;
    private Integer totalPoints;
    private Double currentLatitude;
    private Double currentLongitude;
    private Double currentSpeed;
    private Double heading;
    private Integer progressPercentage;
    private Double distanceTraveled;
    private Long elapsedTimeSeconds;
    private Long remainingTimeSeconds;
    private Integer totalDurationSeconds; // Total trip duration in seconds
    private Integer elapsedSeconds; // Time elapsed since start in seconds
}
