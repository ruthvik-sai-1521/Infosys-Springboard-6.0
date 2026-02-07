package com.neurofleetx.repository;

import com.neurofleetx.model.VehicleHealthHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface VehicleHealthHistoryRepository extends JpaRepository<VehicleHealthHistory, Long> {

        // 1. Find history by vehicle ID ordered by date desc (Most recent first)
        List<VehicleHealthHistory> findByVehicleIdOrderByRecordedAtDesc(Long vehicleId);

        // 2. Find history within date range for a vehicle
        List<VehicleHealthHistory> findByVehicleIdAndRecordedAtBetweenOrderByRecordedAtDesc(Long vehicleId,
                        LocalDateTime start, LocalDateTime end);

        // 3. Find top 30 records for a vehicle (for trend charts)
        List<VehicleHealthHistory> findTop30ByVehicleIdOrderByRecordedAtDesc(Long vehicleId);

        // 4. Find latest record for a vehicle
        Optional<VehicleHealthHistory> findFirstByVehicleIdOrderByRecordedAtDesc(Long vehicleId);

        // 5. Find all history for vehicles belonging to a specific driver
        List<VehicleHealthHistory> findByVehicleDriverIdOrderByRecordedAtDesc(Long driverId);

        // 6. Native query to get daily averages grouped by date for trend analysis
        @Query(value = "SELECT DATE(recorded_at) as record_date, " +
                        "AVG(health_score) as avg_score, " +
                        "AVG(engine_health) as avg_engine, " +
                        "AVG(tire_health) as avg_tire, " +
                        "AVG(battery_health) as avg_battery, " +
                        "AVG(brake_pad_health) as avg_brakes, " +
                        "AVG(oil_level) as avg_oil " +
                        "FROM vehicle_health_history " +
                        "WHERE vehicle_id = :vehicleId " +
                        "AND recorded_at >= :startDate " +
                        "GROUP BY DATE(recorded_at) " +
                        "ORDER BY record_date ASC", nativeQuery = true)
        List<Map<String, Object>> findDailyAverages(Long vehicleId, LocalDateTime startDate);

        // 7. Native query to get fleet-wide daily averages grouped by date
        @Query(value = "SELECT DATE(recorded_at) as record_date, " +
                        "AVG(health_score) as avg_score, " +
                        "AVG(engine_health) as avg_engine, " +
                        "AVG(tire_health) as avg_tire, " +
                        "AVG(battery_health) as avg_battery, " +
                        "AVG(brake_pad_health) as avg_brakes, " +
                        "AVG(oil_level) as avg_oil " +
                        "FROM vehicle_health_history " +
                        "WHERE recorded_at >= :startDate " +
                        "GROUP BY DATE(recorded_at) " +
                        "ORDER BY record_date ASC", nativeQuery = true)
        List<Map<String, Object>> findFleetDailyAverages(LocalDateTime startDate);

        // 8. Delete old records before a cutoff date (for cleanup)
        @Transactional
        @Modifying
        void deleteByRecordedAtBefore(LocalDateTime cutoffDate);
}
