package com.neurofleetx.controller;

import com.neurofleetx.dto.LatLng;
import com.neurofleetx.dto.RouteOption;
import com.neurofleetx.model.Trip;
import com.neurofleetx.repository.TripRepository;
import com.neurofleetx.service.OpenRouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private OpenRouteService openRouteService;

    @Autowired
    private TripRepository tripRepository;

    /**
     * GET /api/routes/directions
     * Fetch route options from OpenRouteService
     * 
     * @param origin       Origin address or coordinates
     * @param destination  Destination address or coordinates
     * @param alternatives Whether to compute alternative routes (default: true)
     * @return List of route options with distance, duration, polyline
     */
    @GetMapping("/directions")
    public ResponseEntity<?> getDirections(
            @RequestParam String origin,
            @RequestParam String destination,
            @RequestParam(defaultValue = "true") boolean alternatives) {
        try {
            List<RouteOption> routes = openRouteService.getDirections(origin, destination, alternatives);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("routeCount", routes.size());
            response.put("routes", routes);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()));
        }
    }

    /**
     * POST /api/routes/select
     * Save selected route to a trip
     */
    @PostMapping("/select")
    public ResponseEntity<?> selectRoute(@RequestBody Map<String, Object> payload) {
        try {
            // Extract trip ID
            Long tripId = Long.parseLong(payload.get("tripId").toString());
            Optional<Trip> optionalTrip = tripRepository.findById(tripId);

            if (optionalTrip.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Trip not found with ID: " + tripId));
            }

            Trip trip = optionalTrip.get();

            // Update trip with route data
            if (payload.containsKey("encodedPolyline")) {
                trip.setSelectedRoutePolyline(payload.get("encodedPolyline").toString());
            }

            if (payload.containsKey("distanceMeters")) {
                Double distanceMeters = ((Number) payload.get("distanceMeters")).doubleValue();
                trip.setSelectedRouteDistance(distanceMeters / 1000.0); // Convert to km
            }

            if (payload.containsKey("durationSeconds")) {
                Integer durationSeconds = ((Number) payload.get("durationSeconds")).intValue();
                trip.setSelectedRouteDuration(durationSeconds / 60); // Convert to minutes
            }

            // Update source coordinates and address
            if (payload.containsKey("sourceLatitude")) {
                trip.setSourceLatitude(((Number) payload.get("sourceLatitude")).doubleValue());
            }
            if (payload.containsKey("sourceLongitude")) {
                trip.setSourceLongitude(((Number) payload.get("sourceLongitude")).doubleValue());
            }
            if (payload.containsKey("sourceAddress")) {
                trip.setSourceAddress(payload.get("sourceAddress").toString());
            }

            // Update destination coordinates and address
            if (payload.containsKey("destinationLatitude")) {
                trip.setDestinationLatitude(((Number) payload.get("destinationLatitude")).doubleValue());
            }
            if (payload.containsKey("destinationLongitude")) {
                trip.setDestinationLongitude(((Number) payload.get("destinationLongitude")).doubleValue());
            }
            if (payload.containsKey("destinationAddress")) {
                trip.setDestinationAddress(payload.get("destinationAddress").toString());
            }

            // Save updated trip
            tripRepository.save(trip);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Route saved successfully");
            response.put("tripId", trip.getId());
            response.put("distanceKm", trip.getSelectedRouteDistance());
            response.put("durationMinutes", trip.getSelectedRouteDuration());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to save route: " + e.getMessage()));
        }
    }

    /**
     * GET /api/routes/trip/{tripId}
     * Get saved route for a specific trip
     */
    @GetMapping("/trip/{tripId}")
    public ResponseEntity<?> getTripRoute(@PathVariable Long tripId) {
        try {
            Optional<Trip> optionalTrip = tripRepository.findById(tripId);

            if (optionalTrip.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Trip not found with ID: " + tripId));
            }

            Trip trip = optionalTrip.get();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tripId", trip.getId());
            response.put("source", trip.getSource());
            response.put("destination", trip.getDestination());

            // Source coordinates and address
            if (trip.getSourceLatitude() != null && trip.getSourceLongitude() != null) {
                Map<String, Object> sourceCoords = new HashMap<>();
                sourceCoords.put("latitude", trip.getSourceLatitude());
                sourceCoords.put("longitude", trip.getSourceLongitude());
                sourceCoords.put("address", trip.getSourceAddress());
                response.put("sourceCoordinates", sourceCoords);
            }

            // Destination coordinates and address
            if (trip.getDestinationLatitude() != null && trip.getDestinationLongitude() != null) {
                Map<String, Object> destCoords = new HashMap<>();
                destCoords.put("latitude", trip.getDestinationLatitude());
                destCoords.put("longitude", trip.getDestinationLongitude());
                destCoords.put("address", trip.getDestinationAddress());
                response.put("destinationCoordinates", destCoords);
            }

            // Route data
            if (trip.getSelectedRoutePolyline() != null) {
                response.put("encodedPolyline", trip.getSelectedRoutePolyline());

                // Decode polyline to coordinates array
                try {
                    List<LatLng> coordinates = openRouteService.decodePolyline(trip.getSelectedRoutePolyline());
                    response.put("decodedCoordinates", coordinates);
                    response.put("totalPoints", coordinates.size());
                } catch (Exception e) {
                    // If decoding fails, just skip it
                    response.put("decodedCoordinates", null);
                }
            }

            response.put("distanceKm", trip.getSelectedRouteDistance());
            response.put("durationMinutes", trip.getSelectedRouteDuration());
            response.put("totalKm", trip.getTotalKm());
            response.put("estimatedReachingTime", trip.getEstimatedReachingTime());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to fetch trip route: " + e.getMessage()));
        }
    }

    /**
     * GET /api/routes/decode-polyline
     * Utility endpoint to decode a polyline string
     */
    @GetMapping("/decode-polyline")
    public ResponseEntity<?> decodePolyline(@RequestParam String polyline) {
        try {
            List<LatLng> coordinates = openRouteService.decodePolyline(polyline);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("coordinates", coordinates);
            response.put("totalPoints", coordinates.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to decode polyline: " + e.getMessage()));
        }
    }

    /**
     * GET /api/routes/reverse-geocode
     * Get address from coordinates
     */
    @GetMapping("/reverse-geocode")
    public ResponseEntity<?> reverseGeocode(
            @RequestParam Double lat,
            @RequestParam Double lng) {
        try {
            String address = openRouteService.reverseGeocode(lat, lng);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("latitude", lat);
            response.put("longitude", lng);
            response.put("address", address);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to reverse geocode: " + e.getMessage()));
        }
    }

    /**
     * GET /api/routes/eta
     * Calculate ETA based on duration
     */
    @GetMapping("/eta")
    public ResponseEntity<?> calculateETA(@RequestParam Integer durationSeconds) {
        try {
            Map<String, Object> eta = openRouteService.calculateETA(durationSeconds);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.putAll(eta);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Failed to calculate ETA: " + e.getMessage()));
        }
    }
}
