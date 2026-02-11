package com.neurofleetx.repository;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.model.User;
import com.neurofleetx.model.HealthStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Collection;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByDriver(User driver);

    // Robust alternative
    List<Vehicle> findByDriverId(Long driverId);

    List<Vehicle> findByStatus(String status);

    // --- Health Monitoring Queries ---

    // 1. Find vehicles by healthStatus
    List<Vehicle> findByHealthStatus(HealthStatus healthStatus);

    // 2. Find vehicles where healthScore is below a threshold
    List<Vehicle> findByHealthScoreLessThan(Integer healthScore);

    // 3. Find vehicles with specific health statuses (e.g. CRITICAL or DUE)
    List<Vehicle> findByHealthStatusIn(Collection<HealthStatus> statuses);

    // 4. Query to get health status distribution count
    @Query("SELECT v.healthStatus, COUNT(v) FROM Vehicle v GROUP BY v.healthStatus")
    List<Object[]> countVehiclesByHealthStatus();

    // 5. Query to get average health scores across fleet
    @Query("SELECT AVG(v.healthScore) FROM Vehicle v")
    Double getAverageFleetHealthScore();

    // 6. Find vehicles due for service (by kilometers)
    List<Vehicle> findByKmsSinceLastServiceGreaterThanEqual(Integer kms);

    // Find vehicles due for service (by date - string comparison relies on
    // YYYY-MM-DD format)
    List<Vehicle> findByNextServiceDateLessThanEqual(String date);

    @Query("SELECT v FROM Vehicle v WHERE v.kmsSinceLastService >= :kms OR v.nextServiceDate <= :date")
    List<Vehicle> findDueForService(@Param("kms") Integer kms, @Param("date") String date);

    // Report methods
    long countByDriverId(Long driverId);
}