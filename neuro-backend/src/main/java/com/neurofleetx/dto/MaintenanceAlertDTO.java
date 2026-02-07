package com.neurofleetx.dto;

import com.neurofleetx.model.MaintenanceAlert;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class MaintenanceAlertDTO {
    private Long id;
    private Long vehicleId;
    private String vehicleNumber;
    private Long driverId;
    private String driverName;

    private String alertType;
    private String component;
    private String severity;
    private String status;
    private String title;
    private String description;

    private LocalDateTime createdAt;
    private String timeAgo; // Helper e.g. "2 hours ago"

    public MaintenanceAlertDTO(MaintenanceAlert alert) {
        this.id = alert.getId();
        this.vehicleId = alert.getVehicle().getId();
        this.vehicleNumber = alert.getVehicle().getVehicleNumber();
        if (alert.getDriver() != null) {
            this.driverId = alert.getDriver().getId();
            this.driverName = alert.getDriver().getUsername();
        }

        this.alertType = alert.getAlertType().name();
        this.component = alert.getComponent();
        this.severity = alert.getSeverity().name();
        this.status = alert.getStatus().name();
        this.title = alert.getTitle();
        this.description = alert.getDescription();
        this.createdAt = alert.getCreatedAt();
    }
}
