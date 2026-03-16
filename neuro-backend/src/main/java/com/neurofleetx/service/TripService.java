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

    @Autowired
    private VehicleHealthSimulationService healthSimulationService;

    @Autowired
    private VehicleHealthService healthService;

    public Trip createTrip(TripRequest tripRequest) {
        Trip trip = new Trip();
        trip.setDriver(userRepository.findById(tripRequest.getDriverId())
                .orElseThrow(() -> new RuntimeException("Driver not found")));

        Vehicle vehicle = vehicleRepository.findById(tripRequest.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        trip.setVehicle(vehicle);

        trip.setSource(tripRequest.getSource());
        trip.setDestination(tripRequest.getDestination());
        trip.setTripDate(tripRequest.getTripDate());
        trip.setAvailableSeats(tripRequest.getAvailableSeats());
        trip.setPickupPoints(tripRequest.getPickupPoints());
        trip.setDropPoints(tripRequest.getDropPoints());
        trip.setTotalKm(tripRequest.getTotalKm());
        trip.setEstimatedReachingTime(tripRequest.getEstimatedReachingTime());
        trip.setStatus("SCHEDULED");

        // Calculate fare automatically based on vehicle type and distance
        Double calculatedFare = calculateFare(vehicle.getType(), tripRequest.getTotalKm());
        trip.setFare(calculatedFare);

        // Set estimated duration and calculate auto-end time if provided
        if (tripRequest.getEstimatedDuration() != null && tripRequest.getTripDate() != null) {
            trip.setEstimatedDuration(tripRequest.getEstimatedDuration());
            trip.setAutoEndTime(tripRequest.getTripDate().plusMinutes(tripRequest.getEstimatedDuration()));
        }

        // Add to driver's pending earnings
        User driver = trip.getDriver();
        Double currentPending = driver.getPendingEarnings();
        driver.setPendingEarnings(
                (currentPending != null ? currentPending : 0.0) + calculatedFare);
        userRepository.save(driver);

        return tripRepository.save(trip);
    }

    /**
     * Calculate fare based on vehicle type and distance
     * EV: ₹15 per km
     * Hatchback: ₹20 per km
     * Sedan: ₹25 per km
     * SUV: ₹30 per km
     */
    private Double calculateFare(String vehicleType, Double distanceKm) {
        if (distanceKm == null || distanceKm <= 0) {
            return 0.0;
        }

        double ratePerKm;
        String type = vehicleType != null ? vehicleType.toUpperCase() : "";

        switch (type) {
            case "SUV":
                ratePerKm = 30.0;
                break;
            case "SEDAN":
                ratePerKm = 25.0;
                break;
            case "HATCHBACK":
                ratePerKm = 20.0;
                break;
            case "EV":
                ratePerKm = 15.0;
                break;
            default:
                ratePerKm = 20.0; // default to hatchback rate
        }

        return Math.round(distanceKm * ratePerKm * 100.0) / 100.0;
    }

    public List<Trip> searchTrips(String source, String destination) {
        // Find scheduled trips from now onwards
        return tripRepository
                .findBySourceContainingIgnoreCaseAndDestinationContainingIgnoreCaseAndTripDateAfterAndStatusOrderByTripDateDesc(
                        source, destination, LocalDateTime.now(), "SCHEDULED");
    }

    public List<Trip> getDriverTrips(Long driverId) {
        return tripRepository.findByDriverIdOrderByTripDateDesc(driverId);
    }

    public List<Trip> getAllTrips() {
        return tripRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
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

        // Update vehicle health based on trip distance
        updateVehicleHealthAfterTrip(trip);

        return tripRepository.save(trip);
    }

    /**
     * Auto-end trips that have exceeded their auto-end time (IN_PROGRESS)
     * Also auto-completes SCHEDULED trips whose scheduled time + duration has
     * passed
     * Called by scheduler every 5 minutes
     */
    public void autoEndTrips() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Auto-end IN_PROGRESS trips that exceeded their duration
        List<Trip> tripsToEnd = tripRepository.findByStatusAndAutoEndTimeBefore("IN_PROGRESS", now);
        for (Trip trip : tripsToEnd) {
            trip.setStatus("AUTO_COMPLETED");
            trip.setActualEndTime(trip.getAutoEndTime() != null ? trip.getAutoEndTime() : now);
            updateDriverStats(trip);
            updateVehicleHealthAfterTrip(trip);
            tripRepository.save(trip);
            System.out.println("Auto-ended IN_PROGRESS trip #" + trip.getId());
        }

        // 2. Auto-complete SCHEDULED trips whose scheduled time + estimated duration
        // has passed
        List<Trip> scheduledTrips = tripRepository.findByStatus("SCHEDULED");
        for (Trip trip : scheduledTrips) {
            if (trip.getTripDate() == null)
                continue;

            // Use estimatedDuration if available, else default 60 minutes
            int durationMinutes = (trip.getEstimatedDuration() != null && trip.getEstimatedDuration() > 0)
                    ? trip.getEstimatedDuration()
                    : 60;

            LocalDateTime expectedEnd = trip.getTripDate().plusMinutes(durationMinutes);

            if (expectedEnd.isBefore(now)) {
                trip.setStatus("AUTO_COMPLETED");
                trip.setActualStartTime(trip.getTripDate());
                trip.setActualEndTime(expectedEnd);
                updateDriverStats(trip);
                updateVehicleHealthAfterTrip(trip);
                tripRepository.save(trip);
                System.out.println("Auto-completed overdue SCHEDULED trip #" + trip.getId()
                        + " (was scheduled for " + trip.getTripDate() + ")");
            }
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

    /**
     * Update vehicle health after trip completion
     * - Updates kilometers driven
     * - Applies realistic wear based on distance
     * - Recalculates health status
     */
    private void updateVehicleHealthAfterTrip(Trip trip) {
        Vehicle vehicle = trip.getVehicle();
        if (vehicle == null)
            return;

        // Determine distance driven (prefer selectedRouteDistance, fallback to totalKm)
        Double distanceKm = trip.getSelectedRouteDistance() != null ? trip.getSelectedRouteDistance()
                : trip.getTotalKm();

        if (distanceKm == null || distanceKm <= 0)
            return;

        int tripKms = (int) Math.round(distanceKm);

        // Update kilometers driven
        int currentKms = vehicle.getKmsDriven() != null ? vehicle.getKmsDriven() : 0;
        vehicle.setKmsDriven(currentKms + tripKms);

        // Update kilometers since last service
        int kmsSinceService = vehicle.getKmsSinceLastService() != null ? vehicle.getKmsSinceLastService() : 0;
        vehicle.setKmsSinceLastService(kmsSinceService + tripKms);

        // Apply realistic wear based on distance
        healthSimulationService.applyTripWear(vehicle, tripKms);

        // Recalculate overall health status
        healthService.updateHealthStatus(vehicle);

        vehicleRepository.save(vehicle);
    }
}
