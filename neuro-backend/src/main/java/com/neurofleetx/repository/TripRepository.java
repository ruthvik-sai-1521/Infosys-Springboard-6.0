package com.neurofleetx.repository;

import com.neurofleetx.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByDriverId(Long driverId);

    // Search trips with source, destination, date after now, and specific status
    List<Trip> findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCaseAndTripDateAfterAndStatus(
            String source, String destination, LocalDateTime tripDate, String status);

    List<Trip> findByStatus(String status);

    // Find trips that need to be auto-ended
    List<Trip> findByStatusAndAutoEndTimeBefore(String status, LocalDateTime autoEndTime);
}
