package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationUpdateMessage {
    private Long vehicleId;
    private Long tripId;
    private Long driverId;
    private Location location;
    private Double speed;
    private Double heading;
    private Progress progress;
    private String status;
    private Long timestamp;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Location {
        private Double latitude;
        private Double longitude;
        private Double altitude;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Progress {
        private Integer currentIndex;
        private Integer totalPoints;
        private Integer percentage;
        private Double distanceTraveled;
        private Double totalDistance;
        private Long elapsedTimeSeconds;
        private Long remainingTimeSeconds;
    }
}
