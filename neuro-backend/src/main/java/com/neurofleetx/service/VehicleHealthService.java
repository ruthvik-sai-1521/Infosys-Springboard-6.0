package com.neurofleetx.service;

import com.neurofleetx.dto.*;
import com.neurofleetx.model.*;
import com.neurofleetx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VehicleHealthService {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleHealthHistoryRepository healthHistoryRepository;

    @Autowired
    private MaintenanceAlertRepository alertRepository;

    @Autowired
    private MaintenanceScheduleRepository scheduleRepository;

    @Autowired
    private TripRepository tripRepository;

    /**
     * Calculate weighted overall health score
     */
    public int calculateHealthScore(Vehicle vehicle) {
        double score = 0.0;

        // Weights
        // Engine: 25%
        // Tires: 20%
        // Battery: 15%
        // Brakes: 15%
        // Oil: 10%
        // Coolant: 5%
        // Transmission: 10%

        score += (vehicle.getEngineHealth() != null ? vehicle.getEngineHealth() : 100) * 0.25;
        score += (vehicle.getTireHealth() != null ? vehicle.getTireHealth() : 100) * 0.20;
        score += (vehicle.getBatteryHealth() != null ? vehicle.getBatteryHealth() : 100) * 0.15;
        score += (vehicle.getBrakePadHealth() != null ? vehicle.getBrakePadHealth() : 100) * 0.15;
        score += (vehicle.getOilLevel() != null ? vehicle.getOilLevel() : 100) * 0.10;
        score += (vehicle.getCoolantLevel() != null ? vehicle.getCoolantLevel() : 100) * 0.05;
        score += (vehicle.getTransmissionHealth() != null ? vehicle.getTransmissionHealth() : 100) * 0.10;

        return (int) Math.round(score);
    }

    /**
     * Update vehicle's healthScore and healthStatus based on calculated score
     */
    @Transactional
    public void updateHealthStatus(Vehicle vehicle) {
        int score = calculateHealthScore(vehicle);
        vehicle.setHealthScore(score);

        if (score < 50) {
            vehicle.setHealthStatus(HealthStatus.CRITICAL);
        } else if (score < 70) {
            vehicle.setHealthStatus(HealthStatus.DUE);
        } else if (score < 85) {
            vehicle.setHealthStatus(HealthStatus.WARNING);
        } else if (score < 95) {
            vehicle.setHealthStatus(HealthStatus.GOOD);
        } else {
            vehicle.setHealthStatus(HealthStatus.HEALTHY);
        }

        vehicle.setLastHealthCheck(LocalDateTime.now());
        vehicleRepository.save(vehicle);
    }

    /**
     * Return VehicleHealthDTO for a vehicle with alert count
     */
    public VehicleHealthDTO getVehicleHealth(Long vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        long activeAlerts = alertRepository.countByVehicleIdAndStatus(vehicleId, MaintenanceAlert.AlertStatus.ACTIVE);
        return new VehicleHealthDTO(vehicle, activeAlerts);
    }

    /**
     * Return list of VehicleHealthDTO for driver's vehicles
     */
    public List<VehicleHealthDTO> getDriverVehiclesHealth(Long driverId) {
        List<Vehicle> vehicles = vehicleRepository.findByDriverId(driverId);
        return vehicles.stream().map(v -> {
            long activeAlerts = alertRepository.countByVehicleIdAndStatus(v.getId(),
                    MaintenanceAlert.AlertStatus.ACTIVE);
            return new VehicleHealthDTO(v, activeAlerts);
        }).collect(Collectors.toList());
    }

    /**
     * Return FleetHealthSummaryDTO with all aggregated fleet data
     */
    public FleetHealthSummaryDTO getFleetHealthSummary() {
        FleetHealthSummaryDTO summary = new FleetHealthSummaryDTO();
        List<Vehicle> allVehicles = vehicleRepository.findAll();

        // 1. Vehicle Counts
        summary.setTotalVehicles(allVehicles.size());
        summary.setHealthyVehicles(allVehicles.stream()
                .filter(v -> v.getHealthStatus() == HealthStatus.HEALTHY || v.getHealthStatus() == HealthStatus.GOOD)
                .count());
        summary.setWarningVehicles(
                allVehicles.stream().filter(v -> v.getHealthStatus() == HealthStatus.WARNING).count());
        summary.setCriticalVehicles(allVehicles.stream()
                .filter(v -> v.getHealthStatus() == HealthStatus.CRITICAL || v.getHealthStatus() == HealthStatus.DUE)
                .count());

        // Due for service (simplified check, e.g., > 9000km since last service)
        summary.setDueForServiceVehicles(allVehicles.stream()
                .filter(v -> v.getKmsSinceLastService() != null && v.getKmsSinceLastService() > 9000).count());

        // 2. Status Distribution
        Map<String, Long> distribution = allVehicles.stream()
                .collect(Collectors.groupingBy(v -> v.getHealthStatus().name(), Collectors.counting()));
        summary.setStatusDistribution(distribution);

        // 3. Average Metrics
        summary.setAvgOverallHealth(allVehicles.stream()
                .mapToInt(v -> v.getHealthScore() != null ? v.getHealthScore() : 100).average().orElse(0));
        summary.setAvgEngineHealth(allVehicles.stream()
                .mapToInt(v -> v.getEngineHealth() != null ? v.getEngineHealth() : 100).average().orElse(0));
        summary.setAvgTireHealth(allVehicles.stream().mapToInt(v -> v.getTireHealth() != null ? v.getTireHealth() : 100)
                .average().orElse(0));
        summary.setAvgBatteryHealth(allVehicles.stream()
                .mapToInt(v -> v.getBatteryHealth() != null ? v.getBatteryHealth() : 100).average().orElse(0));

        // 4. Alert Summary
        List<Object[]> alertCounts = alertRepository.countActiveAlertsGroupedBySeverity();
        for (Object[] row : alertCounts) {
            MaintenanceAlert.AlertSeverity severity = (MaintenanceAlert.AlertSeverity) row[0];
            Long count = (Long) row[1];
            if (severity == MaintenanceAlert.AlertSeverity.CRITICAL)
                summary.setCriticalAlerts(count);
            else if (severity == MaintenanceAlert.AlertSeverity.HIGH)
                summary.setHighAlerts(count);
            else if (severity == MaintenanceAlert.AlertSeverity.MEDIUM)
                summary.setMediumAlerts(count);
            else if (severity == MaintenanceAlert.AlertSeverity.LOW)
                summary.setLowAlerts(count);
            summary.setTotalActiveAlerts(summary.getTotalActiveAlerts() + count);
        }

        // 5. Recent Alerts
        List<MaintenanceAlert> recentAlerts = alertRepository
                .findByStatusOrderByCreatedAtDesc(MaintenanceAlert.AlertStatus.ACTIVE);
        summary.setRecentAlerts(
                recentAlerts.stream().limit(10).map(MaintenanceAlertDTO::new).collect(Collectors.toList()));

        // 6. Vehicles Needing Attention
        List<Vehicle> attentionVehicles = vehicleRepository
                .findByHealthStatusIn(Arrays.asList(HealthStatus.CRITICAL, HealthStatus.DUE, HealthStatus.WARNING));
        summary.setVehiclesNeedingAttention(convertToHealthDTOs(attentionVehicles));

        // 7. Upcoming Schedules
        List<MaintenanceSchedule> schedules = scheduleRepository
                .findByStatus(MaintenanceSchedule.ScheduleStatus.SCHEDULED);
        summary.setUpcomingSchedules(
                schedules.stream().limit(10).map(MaintenanceScheduleDTO::new).collect(Collectors.toList()));

        // 8. All Vehicles Health (for Grid View in Manager Panel)
        summary.setAllVehiclesHealth(convertToHealthDTOs(allVehicles));

        return summary;
    }

    /**
     * Helper to convert Vehicle list to DTO list with alert counts
     */
    private List<VehicleHealthDTO> convertToHealthDTOs(List<Vehicle> vehicles) {
        return vehicles.stream().map(v -> {
            long alerts = alertRepository.countByVehicleIdAndStatus(v.getId(), MaintenanceAlert.AlertStatus.ACTIVE);
            return new VehicleHealthDTO(v, alerts);
        }).collect(Collectors.toList());
    }

    /**
     * Save current health to history table
     */
    @Transactional
    public void recordHealthSnapshot(Long vehicleId, Long tripId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
        if (vehicle != null) {
            Trip trip = (tripId != null) ? tripRepository.findById(tripId).orElse(null) : null;
            VehicleHealthHistory history = new VehicleHealthHistory(vehicle, trip);
            healthHistoryRepository.save(history);
        }
    }

    /**
     * Return HealthTrendDTO with historical data for charts
     */
    public HealthTrendDTO getHealthTrend(Long vehicleId, int days) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Map<String, Object>> dailyStats = healthHistoryRepository.findDailyAverages(vehicleId, startDate);

        HealthTrendDTO trend = new HealthTrendDTO();
        trend.setVehicleId(vehicle.getId());
        trend.setVehicleNumber(vehicle.getVehicleNumber());

        for (Map<String, Object> stat : dailyStats) {
            // Need to parse Date from SQL result. It might be java.sql.Date or String
            Object dateObj = stat.get("record_date");
            String dateStr = dateObj.toString();

            trend.getOverallHealthTrend().add(new HealthTrendDTO.TrendDataPoint(dateStr,
                    ((Number) stat.get("avg_score")).doubleValue(), "Overall"));
            trend.getEngineHealthTrend().add(new HealthTrendDTO.TrendDataPoint(dateStr,
                    ((Number) stat.get("avg_engine")).doubleValue(), "Engine"));
            trend.getTireHealthTrend().add(
                    new HealthTrendDTO.TrendDataPoint(dateStr, ((Number) stat.get("avg_tire")).doubleValue(), "Tires"));
            trend.getBatteryHealthTrend().add(new HealthTrendDTO.TrendDataPoint(dateStr,
                    ((Number) stat.get("avg_battery")).doubleValue(), "Battery"));
        }

        return trend;
    }

    /**
     * Return aggregated fleet health trend over time
     */
    public HealthTrendDTO getFleetHealthTrend(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);

        // Get all vehicles
        List<Vehicle> allVehicles = vehicleRepository.findAll();

        // Aggregate health history for all vehicles grouped by date
        List<Map<String, Object>> fleetDailyStats = healthHistoryRepository.findFleetDailyAverages(startDate);

        HealthTrendDTO trend = new HealthTrendDTO();
        trend.setVehicleId(null); // Fleet-wide, no specific vehicle
        trend.setVehicleNumber("FLEET");

        for (Map<String, Object> stat : fleetDailyStats) {
            Object dateObj = stat.get("record_date");
            String dateStr = dateObj.toString();

            trend.getOverallHealthTrend().add(new HealthTrendDTO.TrendDataPoint(dateStr,
                    ((Number) stat.get("avg_score")).doubleValue(), "Overall"));
            trend.getEngineHealthTrend().add(new HealthTrendDTO.TrendDataPoint(dateStr,
                    ((Number) stat.get("avg_engine")).doubleValue(), "Engine"));
            trend.getTireHealthTrend().add(
                    new HealthTrendDTO.TrendDataPoint(dateStr, ((Number) stat.get("avg_tire")).doubleValue(), "Tires"));
            trend.getBatteryHealthTrend().add(new HealthTrendDTO.TrendDataPoint(dateStr,
                    ((Number) stat.get("avg_battery")).doubleValue(), "Battery"));
        }

        return trend;
    }
}
