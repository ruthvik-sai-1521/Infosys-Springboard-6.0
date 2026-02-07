package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_schedules")
@Data
@NoArgsConstructor
public class MaintenanceSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MaintenanceType maintenanceType;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MaintenancePriority priority = MaintenancePriority.NORMAL;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "completed_date")
    private LocalDateTime completedDate;

    @Column(name = "estimated_cost")
    private Double estimatedCost;

    @Column(name = "actual_cost")
    private Double actualCost;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "service_provider")
    private String serviceProvider;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // --- Enums ---

    @Getter
    public enum MaintenanceType {
        OIL_CHANGE("Oil Change", 10000),
        TIRE_ROTATION("Tire Rotation", 8000),
        BRAKE_INSPECTION("Brake Inspection", 20000),
        BATTERY_CHECK("Battery Check", 15000),
        COOLANT_FLUSH("Coolant Flush", 40000),
        TRANSMISSION_FLUID("Transmission Fluid", 60000),
        GENERAL_SERVICE("General Service", 10000),
        OTHER("Other", 0);

        private final String displayName;
        private final int typicalIntervalKm;

        MaintenanceType(String displayName, int typicalIntervalKm) {
            this.displayName = displayName;
            this.typicalIntervalKm = typicalIntervalKm;
        }
    }

    public enum MaintenancePriority {
        LOW, NORMAL, HIGH, URGENT
    }

    public enum ScheduleStatus {
        PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE
    }
}
