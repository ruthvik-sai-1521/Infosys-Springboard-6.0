package com.neurofleetx.dto;

import com.neurofleetx.model.MaintenanceAlert;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class AlertDTO {
    // 1. Identification
    private Long id;
    private Long vehicleId;
    private String vehicleNumber;
    private Long driverId;
    private String driverName;

    // 2. Alert Details
    private String type;
    private String component;
    private String severity;
    private String severityColor;
    private String title;
    private String description;

    // 3. Values
    private String currentValue;
    private String thresholdValue;

    // 4. Recommendation
    private String recommendedAction;

    // 5. Status and Timestamps
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime acknowledgedAt;
    private LocalDateTime resolvedAt;

    // 6. Formatted
    private String timeAgo;

    public AlertDTO(MaintenanceAlert alert) {
        this.id = alert.getId();
        if (alert.getVehicle() != null) {
            this.vehicleId = alert.getVehicle().getId();
            this.vehicleNumber = alert.getVehicle().getVehicleNumber();
        }
        if (alert.getDriver() != null) {
            this.driverId = alert.getDriver().getId();
            this.driverName = alert.getDriver().getUsername();
        }

        this.type = alert.getAlertType().name();
        this.component = alert.getComponent();
        this.severity = alert.getSeverity().getDisplayName(); // Check if 'getDisplayName' or 'name' is desired. For
                                                              // frontend 'name' enum often easier to style, but
                                                              // description says "severity". Let's use name() for
                                                              // consistency and colorCode for color.
        this.severityColor = alert.getSeverity().getColorCode();
        this.title = alert.getTitle();
        this.description = alert.getDescription();

        this.currentValue = alert.getCurrentValue();
        this.thresholdValue = alert.getThresholdValue();
        this.recommendedAction = alert.getRecommendedAction();

        this.status = alert.getStatus().name();
        this.createdAt = alert.getCreatedAt();
        this.acknowledgedAt = alert.getAcknowledgedAt();
        this.resolvedAt = alert.getResolvedAt();

        if (this.createdAt != null) {
            this.timeAgo = calculateTimeAgo(this.createdAt);
        }
    }

    private String calculateTimeAgo(LocalDateTime dateTime) {
        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60) {
            return "Just now";
        } else if (seconds < 3600) {
            long minutes = seconds / 60;
            return minutes + (minutes == 1 ? " minute ago" : " minutes ago");
        } else if (seconds < 86400) {
            long hours = seconds / 3600;
            return hours + (hours == 1 ? " hour ago" : " hours ago");
        } else if (seconds < 604800) { // 7 days
            long days = seconds / 86400;
            return days + (days == 1 ? " day ago" : " days ago");
        } else {
            // Simply return date if > 1 week, or "X weeks ago"
            // Let's use simpler logic for now
            long days = seconds / 86400;
            return days + " days ago";
        }
    }
}
