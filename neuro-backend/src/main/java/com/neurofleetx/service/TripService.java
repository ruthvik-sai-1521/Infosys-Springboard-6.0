package com.neurofleetx.service;

import com.neurofleetx.dto.TripRequest;
import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.TripRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TripService {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    public Trip createTrip(TripRequest tripRequest) {
        Trip trip = new Trip();
        trip.setDriver(userRepository.findById(tripRequest.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found")));
        trip.setVehicle(vehicleRepository.findById(tripRequest.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found")));
        trip.setSource(tripRequest.getSource());
        trip.setDestination(tripRequest.getDestination());
        trip.setTripDate(tripRequest.getTripDate());
        trip.setFare(tripRequest.getFare());
        trip.setAvailableSeats(tripRequest.getAvailableSeats());
        trip.setPickupPoints(tripRequest.getPickupPoints());
        trip.setDropPoints(tripRequest.getDropPoints());
        trip.setTotalKm(tripRequest.getTotalKm());
        trip.setStatus("SCHEDULED");

        // Set estimated duration and calculate auto-end time if provided
        if (tripRequest.getEstimatedDuration() != null && tripRequest.getTripDate() != null) {
            trip.setEstimatedDuration(tripRequest.getEstimatedDuration());
            trip.setAutoEndTime(tripRequest.getTripDate().plusMinutes(tripRequest.getEstimatedDuration()));
        }

        // Add to driver's pending earnings
        User driver = trip.getDriver();
        Double currentPending = driver.getPendingEarnings();
        Double tripFare = trip.getFare();
        driver.setPendingEarnings(
                (currentPending != null ? currentPending : 0.0) + (tripFare != null ? tripFare : 0.0));
        userRepository.save(driver);

        return tripRepository.save(trip);
    }

    public List<Trip> searchTrips(String source, String destination) {
        // Find scheduled trips from now onwards
        return tripRepository
                .findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCaseAndTripDateAfterAndStatus(
                        source, destination, LocalDateTime.now(), "SCHEDULED");
    }

    public List<Trip> getDriverTrips(Long driverId) {
        return tripRepository.findByDriverId(driverId);
    }

    public List<Trip> getAllTrips() {
        return tripRepository.findAll();
    }

    public Trip getTripById(Long id) {
        return tripRepository.findById(id).orElseThrow(() -> new RuntimeException("Trip not found"));
    }

    public Trip startTrip(Long tripId) {
        Trip trip = getTripById(tripId);

        // Validation: can only start scheduled trips
        if (!"SCHEDULED".equals(trip.getStatus())) {
            throw new RuntimeException("Only scheduled trips can be started. Current status: " + trip.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        trip.setStatus("IN_PROGRESS");
        trip.setActualStartTime(now);

        // Calculate auto-end time based on actual start time if estimated duration
        // exists
        if (trip.getEstimatedDuration() != null) {
            trip.setAutoEndTime(now.plusMinutes(trip.getEstimatedDuration()));
        }

        return tripRepository.save(trip);
    }

    public Trip endTrip(Long tripId) {
        Trip trip = getTripById(tripId);

        // Validation: can only end in-progress trips
        if (!"IN_PROGRESS".equals(trip.getStatus())) {
            throw new RuntimeException("Only in-progress trips can be ended. Current status: " + trip.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        trip.setStatus("COMPLETED");
        trip.setActualEndTime(now);

        // Update driver statistics
        updateDriverStats(trip);

        return tripRepository.save(trip);
    }

    /**
     * Auto-end trips that have exceeded their auto-end time
     * Called by scheduler
     */
    public void autoEndTrips() {
        LocalDateTime now = LocalDateTime.now();
        List<Trip> tripsToEnd = tripRepository.findByStatusAndAutoEndTimeBefore("IN_PROGRESS", now);

        for (Trip trip : tripsToEnd) {
            trip.setStatus("AUTO_COMPLETED");
            trip.setActualEndTime(trip.getAutoEndTime() != null ? trip.getAutoEndTime() : now);

            // Update driver statistics
            updateDriverStats(trip);

            tripRepository.save(trip);
            System.out.println("Auto-ended trip #" + trip.getId() + " for driver " + trip.getDriver().getUsername());
        }
    }

    /**
     * Update driver earnings and trip count
     * Moves earnings from pending to actual (completed)
     */
    private void updateDriverStats(Trip trip) {
        User driver = trip.getDriver();

        // Increment trip count
        Integer currentCount = driver.getCompletedTripsCount();
        driver.setCompletedTripsCount(currentCount != null ? currentCount + 1 : 1);

        Double tripFare = trip.getFare() != null ? trip.getFare() : 0.0;

        // Remove from pending earnings
        Double currentPending = driver.getPendingEarnings();
        driver.setPendingEarnings(
                Math.max(0.0, (currentPending != null ? currentPending : 0.0) - tripFare));

        // Add to total (actual) earnings
        Double currentEarnings = driver.getTotalEarnings();
        driver.setTotalEarnings(
                (currentEarnings != null ? currentEarnings : 0.0) + tripFare);

        userRepository.save(driver);
    }
}
