package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_alerts")
@Data
@NoArgsConstructor
public class MaintenanceAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Relationships ---

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    @Column(name = "alert_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertType alertType;

    @Column(name = "component", nullable = false)
    private String component; // e.g., ENGINE_HEALTH, TIRE_PRESSURE_FL

    @Column(name = "severity", nullable = false)
    @Enumerated(EnumType.STRING)
    private AlertSeverity severity;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private AlertStatus status = AlertStatus.ACTIVE;

    // --- Details ---

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "recommended_action", columnDefinition = "TEXT")
    private String recommendedAction;

    // --- Technical Data ---

    @Column(name = "current_value")
    private String currentValue;

    @Column(name = "threshold_value")
    private String thresholdValue;

    // --- Lifecycle ---

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @ManyToOne
    @JoinColumn(name = "acknowledged_by")
    private User acknowledgedBy;

    @ManyToOne
    @JoinColumn(name = "resolved_by")
    private User resolvedBy;

    // --- Constructors ---

    public MaintenanceAlert(Vehicle vehicle, AlertType type, AlertSeverity severity,
            String component, String title, String description) {
        this.vehicle = vehicle;
        this.driver = vehicle.getDriver();
        this.alertType = type;
        this.severity = severity;
        this.component = component;
        this.title = title;
        this.description = description;
        this.createdAt = LocalDateTime.now();
        this.status = AlertStatus.ACTIVE;
    }

    // --- Enums ---

    public enum AlertType {
        PREDICTIVE,
        THRESHOLD,
        SCHEDULED,
        EMERGENCY,
        COMPONENT_FAILURE,
        MAINTENANCE_DUE,
        CRITICAL_ISSUE,
        MAINTENANCE_COMPLETED // Manager performed maintenance, driver should verify
    }

    @Getter
    public enum AlertSeverity {
        LOW("Low", "#3B82F6"), // Blue-500
        MEDIUM("Medium", "#F59E0B"), // Amber-500
        HIGH("High", "#EF4444"), // Red-500
        CRITICAL("Critical", "#B91C1C"); // Red-700

        private final String displayName;
        private final String colorCode;

        AlertSeverity(String displayName, String colorCode) {
            this.displayName = displayName;
            this.colorCode = colorCode;
        }
    }

    public enum AlertStatus {
        ACTIVE, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, DISMISSED
    }
}
