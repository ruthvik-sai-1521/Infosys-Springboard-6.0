package com.neurofleetx.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
public class HealthTrendDTO {
    private Long vehicleId;
    private String vehicleNumber;

    // Trend Data Lists
    private List<TrendDataPoint> engineHealthTrend = new ArrayList<>();
    private List<TrendDataPoint> tireHealthTrend = new ArrayList<>();
    private List<TrendDataPoint> batteryHealthTrend = new ArrayList<>();
    private List<TrendDataPoint> overallHealthTrend = new ArrayList<>();
    private List<TrendDataPoint> fuelEfficiencyTrend = new ArrayList<>();
    private List<TrendDataPoint> mileageTrend = new ArrayList<>();

    // Nested Class for Data Points
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendDataPoint {
        private String date; // Formatted date string
        private Double value;
        private String label; // Optional label

        public TrendDataPoint(LocalDateTime dateTime, Double value) {
            this.date = dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE); // YYYY-MM-DD
            this.value = value;
        }

        public TrendDataPoint(LocalDateTime dateTime, Double value, String label) {
            this.date = dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE);
            this.value = value;
            this.label = label;
        }
    }
}
