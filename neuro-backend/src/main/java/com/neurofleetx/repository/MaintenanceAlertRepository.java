package com.neurofleetx.repository;

import com.neurofleetx.model.MaintenanceAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceAlertRepository extends JpaRepository<MaintenanceAlert, Long> {

        // 1. Find alerts by vehicleId and status, ordered by severity and creation time
        List<MaintenanceAlert> findByVehicleIdAndStatusOrderBySeverityDescCreatedAtDesc(Long vehicleId,
                        MaintenanceAlert.AlertStatus status);

        // Find all alerts for a vehicle (active)
        List<MaintenanceAlert> findByVehicleIdAndStatus(Long vehicleId, MaintenanceAlert.AlertStatus status);

        // Find all alerts for a vehicle (history)
        List<MaintenanceAlert> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);

        // 2. Find all alerts by status
        List<MaintenanceAlert> findByStatusOrderByCreatedAtDesc(MaintenanceAlert.AlertStatus status);

        // 3. Find alerts by driverId and status
        List<MaintenanceAlert> findByDriverIdAndStatusOrderBySeverityDesc(Long driverId,
                        MaintenanceAlert.AlertStatus status);

        // 4. Find alerts by severity and status
        List<MaintenanceAlert> findByStatusAndSeverity(MaintenanceAlert.AlertStatus status,
                        MaintenanceAlert.AlertSeverity severity);

        // 5. Count active alerts grouped by severity (for dashboard summary)
        @Query("SELECT a.severity, COUNT(a) FROM MaintenanceAlert a WHERE a.status = 'ACTIVE' GROUP BY a.severity")
        List<Object[]> countActiveAlertsGroupedBySeverity();

        // 6. Count total alerts by status
        long countByStatus(MaintenanceAlert.AlertStatus status);

        // 7. Check if alert exists for vehicle + component + status (prevent
        // duplicates)
        boolean existsByVehicleIdAndComponentAndStatus(Long vehicleId, String component,
                        MaintenanceAlert.AlertStatus status);

        // 8. Find recent alerts within last 24 hours
        List<MaintenanceAlert> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime timestamp);

        // 9. Find all active and acknowledged alerts for fleet overview
        @Query("SELECT a FROM MaintenanceAlert a WHERE a.status IN ('ACTIVE', 'ACKNOWLEDGED') ORDER BY a.severity DESC, a.createdAt DESC")
        List<MaintenanceAlert> findAllActiveAndAcknowledged();

        // Count active alerts by vehicle
        long countByVehicleIdAndStatus(Long vehicleId, MaintenanceAlert.AlertStatus status);
}
