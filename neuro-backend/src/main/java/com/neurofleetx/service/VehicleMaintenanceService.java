package com.neurofleetx.service;

import com.neurofleetx.model.MaintenanceAlert;
import com.neurofleetx.model.MaintenanceSchedule;
import com.neurofleetx.model.VehicleHealthHistory;
import com.neurofleetx.repository.MaintenanceAlertRepository;
import com.neurofleetx.repository.MaintenanceScheduleRepository;
import com.neurofleetx.repository.VehicleHealthHistoryRepository;
import com.neurofleetx.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class VehicleMaintenanceService {

    @Autowired
    private VehicleHealthHistoryRepository healthHistoryRepository;

    @Autowired
    private MaintenanceScheduleRepository scheduleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    @Autowired
    private MaintenanceAlertService maintenanceAlertService;

    // --- Health History ---

    public List<VehicleHealthHistory> getHealthHistory(Long vehicleId) {
        return healthHistoryRepository.findByVehicleIdOrderByRecordedAtDesc(vehicleId);
    }

    public List<VehicleHealthHistory> getRecentHealthHistory(Long vehicleId) {
        return healthHistoryRepository.findTop30ByVehicleIdOrderByRecordedAtDesc(vehicleId);
    }

    public List<Map<String, Object>> getDailyHealthTrends(Long vehicleId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return healthHistoryRepository.findDailyAverages(vehicleId, startDate);
    }

    // --- Maintenance Alerts ---

    public List<MaintenanceAlert> getActiveAlerts(Long vehicleId) {
        return alertRepository.findByVehicleIdAndStatus(vehicleId, MaintenanceAlert.AlertStatus.ACTIVE);
    }

    public List<MaintenanceAlert> getAllAlerts(Long vehicleId) {
        return alertRepository.findByVehicleIdOrderByCreatedAtDesc(vehicleId);
    }

    public MaintenanceAlert acknowledgeAlert(Long alertId, Long userId) {
        MaintenanceAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));

        alert.setStatus(MaintenanceAlert.AlertStatus.ACKNOWLEDGED);
        alert.setAcknowledgedAt(LocalDateTime.now());
        userRepository.findById(userId).ifPresent(alert::setAcknowledgedBy);

        return alertRepository.save(alert);
    }

    /**
     * Resolve alert - delegates to MaintenanceAlertService which handles metric
     * updates
     * for MAINTENANCE_COMPLETED alerts when driver resolves them
     */
    public MaintenanceAlert resolveAlert(Long alertId, Long userId) {
        // Delegate to MaintenanceAlertService which has the complete logic
        // for handling MAINTENANCE_COMPLETED alerts and updating metrics
        maintenanceAlertService.resolveAlert(alertId, userId);

        // Return the resolved alert entity from repository
        return alertRepository.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
    }

    public List<Object[]> getAlertSummary() {
        return alertRepository.countActiveAlertsGroupedBySeverity();
    }

    // --- Maintenance Schedules ---

    public List<MaintenanceSchedule> getSchedules(Long vehicleId) {
        return scheduleRepository.findByVehicleIdOrderByScheduledDateAsc(vehicleId);
    }

    public MaintenanceSchedule createSchedule(MaintenanceSchedule schedule) {
        return scheduleRepository.save(schedule);
    }

    public MaintenanceSchedule updateScheduleStatus(Long scheduleId, String statusString) {
        MaintenanceSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        try {
            MaintenanceSchedule.ScheduleStatus status = MaintenanceSchedule.ScheduleStatus.valueOf(statusString);
            schedule.setStatus(status);
            if (status == MaintenanceSchedule.ScheduleStatus.COMPLETED) {
                schedule.setCompletedDate(LocalDateTime.now());
            }
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + statusString);
        }

        return scheduleRepository.save(schedule);
    }
}
