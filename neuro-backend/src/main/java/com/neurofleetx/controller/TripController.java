package com.neurofleetx.controller;

import com.neurofleetx.dto.TripValidationResult;
import com.neurofleetx.dto.VehicleHealthDTO;
import com.neurofleetx.model.Trip;
import com.neurofleetx.service.TripService;
import com.neurofleetx.service.TripValidationService;
import com.neurofleetx.service.VehicleHoldService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*")
public class TripController {

    @Autowired
    private TripService tripService;

    @Autowired
    private TripValidationService tripValidationService;

    @Autowired
    private VehicleHoldService vehicleHoldService;

    @PostMapping("/create")
    public ResponseEntity<?> createTrip(@RequestBody com.neurofleetx.dto.TripRequest request) {
        try {
            // Validate vehicle ID exists
            if (request.getVehicleId() == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Vehicle ID is required"));
            }

            // Check if vehicle is on hold (optional - only if holdService succeeds)
            try {
                if (!vehicleHoldService.canCreateTrip(request.getVehicleId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of(
                                    "error", "VEHICLE_ON_HOLD",
                                    "message", "Vehicle is on hold for maintenance. Cannot create trips.",
                                    "holdStatus", vehicleHoldService.getHoldStatus(request.getVehicleId())));
                }
            } catch (Exception e) {
                // If hold check fails, log but continue (backward compatibility)
                System.err.println("Hold check failed: " + e.getMessage());
            }

            // Validate trip health impact (only if totalKm is provided)
            TripValidationResult validation = null;
            if (request.getTotalKm() != null && request.getTotalKm() > 0) {
                try {
                    validation = tripValidationService.validateTrip(
                            request.getVehicleId(),
                            request.getTotalKm());

                    // Only block if validation explicitly says invalid
                    if (validation != null && !validation.isValid()) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of(
                                        "error", "VALIDATION_FAILED",
                                        "validation", validation));
                    }
                } catch (Exception e) {
                    // If validation fails, log but continue (backward compatibility)
                    System.err.println("Trip validation failed: " + e.getMessage());
                }
            }

            // Create trip (original logic)
            Trip createdTrip = tripService.createTrip(request);

            // Return trip with validation warnings if any
            if (validation != null && validation.isWillBeCritical()) {
                return ResponseEntity.ok(Map.of(
                        "trip", createdTrip,
                        "warning", validation));
            }

            return ResponseEntity.ok(createdTrip);

        } catch (Exception e) {
            e.printStackTrace(); // Log full stack trace for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Validate trip before creation - returns prediction
     */
    @PostMapping("/validate")
    public ResponseEntity<TripValidationResult> validateTrip(
            @RequestParam Long vehicleId,
            @RequestParam Double distance) {

        TripValidationResult result = tripValidationService.validateTrip(vehicleId, distance);
        return ResponseEntity.ok(result);
    }

    /**
     * Get predicted health after trip
     */
    @GetMapping("/predict-health")
    public ResponseEntity<VehicleHealthDTO> predictHealth(
            @RequestParam Long vehicleId,
            @RequestParam Double distance) {

        VehicleHealthDTO prediction = tripValidationService.predictHealthAfterTrip(vehicleId, distance);
        return ResponseEntity.ok(prediction);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Trip>> searchTrips(@RequestParam String source, @RequestParam String destination) {
        List<Trip> trips = tripService.searchTrips(source, destination);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Trip>> getDriverTrips(@PathVariable Long driverId) {
        List<Trip> trips = tripService.getDriverTrips(driverId);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Trip>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Trip> startTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.startTrip(id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<Trip> endTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.endTrip(id));
    }
}
