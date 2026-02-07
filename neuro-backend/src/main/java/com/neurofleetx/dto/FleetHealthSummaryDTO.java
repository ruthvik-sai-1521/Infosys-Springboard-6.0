package com.neurofleetx.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class FleetHealthSummaryDTO {

    // 1. Vehicle Counts
    private long totalVehicles;
    private long healthyVehicles;
    private long warningVehicles;
    private long criticalVehicles;
    private long dueForServiceVehicles;

    // 2. Status Distribution for Pie Chart
    private Map<String, Long> statusDistribution; // e.g., "HEALTHY" -> 15

    // 3. Average Health Metrics
    private double avgOverallHealth;
    private double avgEngineHealth;
    private double avgTireHealth;
    private double avgBatteryHealth;

    // 4. Alert Summary
    private long totalActiveAlerts;
    private long criticalAlerts;
    private long highAlerts;
    private long mediumAlerts;
    private long lowAlerts;

    // 5. Recent Alerts
    private List<MaintenanceAlertDTO> recentAlerts;

    // 6. Vehicles Needing Attention (Critical/Due)
    private List<VehicleHealthDTO> vehiclesNeedingAttention;

    // 7. Upcoming Schedules
    private List<MaintenanceScheduleDTO> upcomingSchedules;

    // 8. All Vehicles Health (for Grid View)
    private List<VehicleHealthDTO> allVehiclesHealth;
}
