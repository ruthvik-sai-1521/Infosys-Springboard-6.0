package com.neurofleetx.service;

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

    public Trip createTrip(Trip trip, Long driverId, Long vehicleId) {
        User driver = userRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Driver not found"));
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        trip.setDriver(driver);
        trip.setVehicle(vehicle);
        trip.setStatus("SCHEDULED");
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
        trip.setStatus("IN_PROGRESS");
        // Ensure simulation is handled (if applicable, integration with
        // SimulationController logic might be needed here or handled by frontend
        // calling simulation start)
        return tripRepository.save(trip);
    }

    public Trip endTrip(Long tripId) {
        Trip trip = getTripById(tripId);
        trip.setStatus("COMPLETED");
        return tripRepository.save(trip);
    }
}
