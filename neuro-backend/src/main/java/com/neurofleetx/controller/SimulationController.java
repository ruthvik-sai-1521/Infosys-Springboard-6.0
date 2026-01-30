package com.neurofleetx.controller;

import com.neurofleetx.dto.LatLng;
import com.neurofleetx.dto.SimulationStatus;
import com.neurofleetx.model.Trip;
import com.neurofleetx.repository.TripRepository;
import com.neurofleetx.service.OpenRouteService;
import com.neurofleetx.service.VehicleSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    @Autowired
    private VehicleSimulationService simulationService;

    @Autowired
    private OpenRouteService openRouteService;

    @Autowired
    private TripRepository tripRepository;

    /**
     * POST /api/simulation/start
     * Start vehicle movement simulation
     */
    @PostMapping("/start")
    public ResponseEntity<?> startSimulation(@RequestBody Map<String, Object> payload) {
        try {
            // Extract parameters
            Long vehicleId = Long.parseLong(payload.get("vehicleId").toString());
            Long driverId = Long.parseLong(payload.get("driverId").toString());
            Long tripId = Long.parseLong(payload.get("tripId").toString());

            // Get route coordinates
            List<LatLng> routeCoordinates;
            if (payload.containsKey("encodedPolyline")) {
                // Decode polyline to coordinates
                String encodedPolyline = payload.get("encodedPolyline").toString();
                routeCoordinates = openRouteService.decodePolyline(encodedPolyline);
            } else if (payload.containsKey("routeCoordinates")) {
                // Use provided coordinates array
                List<Map<String, Object>> coordsArray = (List<Map<String, Object>>) payload.get("routeCoordinates");
                routeCoordinates = coordsArray.stream()
                        .map(coord -> new LatLng(
                                ((Number) coord.get("latitude")).doubleValue(),
                                ((Number) coord.get("longitude")).doubleValue()))
                        .toList();
            } else {
                // Try to get from trip
                Optional<Trip> tripOpt = tripRepository.findById(tripId);
                if (tripOpt.isEmpty() || tripOpt.get().getSelectedRoutePolyline() == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "error",
                            "No route data provided. Include 'encodedPolyline' or 'routeCoordinates' or ensure trip has saved route."));
                }
                routeCoordinates = openRouteService.decodePolyline(tripOpt.get().getSelectedRoutePolyline());
            }

            // Get duration and distance
            Integer totalDurationSeconds;
            Double totalDistanceMeters;

            if (payload.containsKey("totalDurationSeconds")) {
                totalDurationSeconds = ((Number) payload.get("totalDurationSeconds")).intValue();
            } else {
                // Try to get from trip
                Optional<Trip> tripOpt = tripRepository.findById(tripId);
                if (tripOpt.isEmpty() || tripOpt.get().getSelectedRouteDuration() == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "error", "totalDurationSeconds is required"));
                }
                totalDurationSeconds = tripOpt.get().getSelectedRouteDuration() * 60; // Convert minutes to seconds
            }

            if (payload.containsKey("totalDistanceMeters")) {
                totalDistanceMeters = ((Number) payload.get("totalDistanceMeters")).doubleValue();
            } else {
                // Try to get from trip
                Optional<Trip> tripOpt = tripRepository.findById(tripId);
                if (tripOpt.isEmpty() || tripOpt.get().getSelectedRouteDistance() == null) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "success", false,
                            "error", "totalDistanceMeters is required"));
                }
                totalDistanceMeters = tripOpt.get().getSelectedRouteDistance() * 1000; // Convert km to meters
            }

            // Validate
            if (routeCoordinates.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Route coordinates are empty"));
            }

            // Start simulation
            SimulationStatus status = simulationService.startSimulation(
                    vehicleId, driverId, tripId,
                    routeCoordinates, totalDurationSeconds, totalDistanceMeters);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Simulation started successfully");
            response.put("status", status);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to start simulation: " + e.getMessage()));
        }
    }

    /**
     * POST /api/simulation/stop
     * Stop vehicle movement simulation
     */
    @PostMapping("/stop")
    public ResponseEntity<?> stopSimulation(@RequestBody Map<String, Object> payload) {
        try {
            Long vehicleId = Long.parseLong(payload.get("vehicleId").toString());

            boolean stopped = simulationService.stopSimulation(vehicleId);

            if (stopped) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Simulation stopped successfully",
                        "vehicleId", vehicleId));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "No active simulation found for vehicle " + vehicleId));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to stop simulation: " + e.getMessage()));
        }
    }

    /**
     * GET /api/simulation/status/{vehicleId}
     * Get simulation status for a vehicle
     */
    @GetMapping("/status/{vehicleId}")
    public ResponseEntity<?> getSimulationStatus(@PathVariable Long vehicleId) {
        try {
            SimulationStatus status = simulationService.getSimulationStatus(vehicleId);

            if (status != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("status", status);
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "status", "NOT_RUNNING",
                        "message", "No active simulation for vehicle " + vehicleId));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to get simulation status: " + e.getMessage()));
        }
    }

    /**
     * GET /api/simulation/active
     * Get all active simulations
     */
    @GetMapping("/active")
    public ResponseEntity<?> getAllActiveSimulations() {
        try {
            Map<Long, SimulationStatus> activeSimulations = simulationService.getAllActiveSimulations();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", activeSimulations.size());
            response.put("simulations", activeSimulations);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to get active simulations: " + e.getMessage()));
        }
    }

    /**
     * POST /api/simulation/start-from-trip
     * Convenience endpoint: Start simulation directly from trip ID
     */
    @PostMapping("/start-from-trip")
    public ResponseEntity<?> startSimulationFromTrip(@RequestBody Map<String, Object> payload) {
        try {
            Long tripId = Long.parseLong(payload.get("tripId").toString());

            Optional<Trip> tripOpt = tripRepository.findById(tripId);
            if (tripOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Trip not found with ID: " + tripId));
            }

            Trip trip = tripOpt.get();

            // Validate trip has required data
            if (trip.getSelectedRoutePolyline() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Trip does not have a saved route. Please select a route first."));
            }

            if (trip.getVehicle() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Trip does not have an assigned vehicle"));
            }

            if (trip.getDriver() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Trip does not have an assigned driver"));
            }

            // Decode route
            List<LatLng> routeCoordinates = openRouteService.decodePolyline(trip.getSelectedRoutePolyline());

            // Get duration and distance
            Integer durationSeconds = trip.getSelectedRouteDuration() != null
                    ? trip.getSelectedRouteDuration() * 60
                    : 3600; // Default 1 hour

            Double distanceMeters = trip.getSelectedRouteDistance() != null
                    ? trip.getSelectedRouteDistance() * 1000
                    : 50000.0; // Default 50 km

            // Start simulation
            SimulationStatus status = simulationService.startSimulation(
                    trip.getVehicle().getId(),
                    trip.getDriver().getId(),
                    trip.getId(),
                    routeCoordinates,
                    durationSeconds,
                    distanceMeters);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Simulation started successfully from trip");
            response.put("status", status);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to start simulation from trip: " + e.getMessage()));
        }
    }
}
