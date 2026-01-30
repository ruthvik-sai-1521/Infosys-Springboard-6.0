package com.neurofleetx.repository;

import com.neurofleetx.model.VehicleLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleLocationRepository extends JpaRepository<VehicleLocation, Long> {

    /**
     * Find all locations for a specific trip, ordered by timestamp descending
     */
    List<VehicleLocation> findByTripIdOrderByTimestampDesc(Long tripId);

    /**
     * Find all locations for a specific vehicle, ordered by timestamp descending
     */
    List<VehicleLocation> findByVehicleIdOrderByTimestampDesc(Long vehicleId);

    /**
     * Find the most recent location for a specific trip
     */
    Optional<VehicleLocation> findTopByTripIdOrderByTimestampDesc(Long tripId);

    /**
     * Find locations for a trip within a time range
     */
    List<VehicleLocation> findByTripIdAndTimestampBetween(Long tripId, LocalDateTime start, LocalDateTime end);

    /**
     * Find the most recent location for a specific vehicle
     */
    Optional<VehicleLocation> findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);
}
