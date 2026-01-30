package com.neurofleetx.repository;

import com.neurofleetx.model.LocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LocationHistoryRepository extends JpaRepository<LocationHistory, Long> {

    /**
     * Find location history for a vehicle within a time range
     */
    List<LocationHistory> findByVehicleIdAndRecordedAtBetween(Long vehicleId, LocalDateTime start, LocalDateTime end);

    /**
     * Find location history for a trip
     */
    List<LocationHistory> findByTripId(Long tripId);

    /**
     * Delete expired location history records (for TTL cleanup)
     * This should be called by a scheduled task
     */
    @Transactional
    void deleteByExpiresAtBefore(LocalDateTime expirationDate);

    /**
     * Count total records for monitoring
     */
    Long countByExpiresAtBefore(LocalDateTime expirationDate);
}
