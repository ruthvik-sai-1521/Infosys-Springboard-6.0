package com.neurofleetx.dto;

import com.neurofleetx.model.MaintenanceSchedule;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class MaintenanceScheduleDTO {
    private Long id;
    private Long vehicleId;
    private String vehicleNumber;

    private String maintenanceType;
    private String priority;
    private String status;
    private LocalDate scheduledDate;

    private String serviceProvider;
    private Double estimatedCost;

    public MaintenanceScheduleDTO(MaintenanceSchedule schedule) {
        this.id = schedule.getId();
        this.vehicleId = schedule.getVehicle().getId();
        this.vehicleNumber = schedule.getVehicle().getVehicleNumber();

        this.maintenanceType = schedule.getMaintenanceType().getDisplayName();
        this.priority = schedule.getPriority().name();
        this.status = schedule.getStatus().name();
        this.scheduledDate = schedule.getScheduledDate();

        this.serviceProvider = schedule.getServiceProvider();
        this.estimatedCost = schedule.getEstimatedCost();
    }
}
