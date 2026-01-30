package com.neurofleetx.repository;

import com.neurofleetx.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByDriverIdOrderByTripDateDesc(Long driverId);

    // Search trips with source, destination, date after now, and specific status
    // Default sort by Date Ascending for generic search? User said "latest comes
    // first".
    // For upcoming trips, "latest" means furthest in future? Or nearest?
    // "Latest comes first" usually means Newest Created or Newest Date.
    // For Past trips: Newest Date first.
    // For Upcoming: Nearest Date first?
    // User said "older one goes down". So -> Newest Date Top.
    List<Trip> findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCaseAndTripDateAfterAndStatusOrderByTripDateDesc(
            String source, String destination, LocalDateTime tripDate, String status);

    List<Trip> findByStatusOrderByTripDateDesc(String status);

    // Find trips that need to be auto-ended
    List<Trip> findByStatusAndAutoEndTimeBefore(String status, LocalDateTime autoEndTime);
}
