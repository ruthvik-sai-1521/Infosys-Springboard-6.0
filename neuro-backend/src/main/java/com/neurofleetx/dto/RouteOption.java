package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RouteOption {
    private String id;
    private String summary;
    private Double distanceMeters;
    private Integer durationSeconds;
    private String encodedPolyline;
    private List<String> warnings;
    private String routeLabel; // e.g., "BEST_ROUTE", "ALTERNATIVE_1"

    // Computed fields for convenience
    private Double distanceKm;
    private Integer durationMinutes;
    private String formattedDistance;
    private String formattedDuration;
}
