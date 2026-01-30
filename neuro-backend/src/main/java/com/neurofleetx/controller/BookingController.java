package com.neurofleetx.controller;

import com.neurofleetx.model.Booking;
import com.neurofleetx.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/book")
    public ResponseEntity<?> bookTrip(@RequestBody Map<String, Object> payload) {
        try {
            Long tripId = ((Number) payload.get("tripId")).longValue();
            Long customerId = ((Number) payload.get("customerId")).longValue();
            // Expecting "seatNumbers" as a List of Strings e.g., ["1A", "1B"]
            List<String> seatNumbers = (List<String>) payload.get("seatNumbers");

            Booking booking = bookingService.bookTrip(tripId, customerId, seatNumbers);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/customer/{customerId}")
    public List<Booking> getCustomerBookings(@PathVariable Long customerId) {
        return bookingService.getCustomerBookings(customerId);
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Booking>> getTripBookings(@PathVariable Long tripId) {
        return ResponseEntity.ok(bookingService.getBookingsForTrip(tripId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    /**
     * NEW: Track vehicle for a specific booking
     * Verifies customer owns booking and checks time window (1 hour before to 1
     * hour after trip)
     */
    @GetMapping("/{bookingId}/track")
    public ResponseEntity<?> trackBooking(@PathVariable Long bookingId, @RequestParam Long customerId) {
        try {
            Booking booking = bookingService.getBookingById(bookingId);

            if (booking == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
            }

            // Verify customer owns this booking
            if (!booking.getCustomer().getId().equals(customerId)) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized: You do not own this booking"));
            }

            // Get trip details
            var trip = booking.getTrip();
            if (trip == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Trip not found for this booking"));
            }

            // Check time window: 1 hour before trip start to 1 hour after trip end
            LocalDateTime tripDateTime = trip.getTripDate();
            LocalDateTime now = LocalDateTime.now();

            LocalDateTime trackingStartTime = tripDateTime.minusHours(1);
            LocalDateTime trackingEndTime;

            // If trip has ended, use actual end time + 1 hour; otherwise use estimated
            // duration
            if (trip.getActualEndTime() != null) {
                trackingEndTime = trip.getActualEndTime().plusHours(1);
            } else {
                // Estimate end time: trip start + estimated duration (in minutes) + 1 hour
                // buffer
                int estimatedDurationMinutes = trip.getEstimatedDuration() != null
                        ? trip.getEstimatedDuration()
                        : 60; // Default 1 hour
                trackingEndTime = tripDateTime.plusMinutes(estimatedDurationMinutes).plusHours(1);
            }

            // Check if current time is within tracking window
            if (now.isBefore(trackingStartTime)) {
                Map<String, Object> response = new HashMap<>();
                response.put("trackingAvailable", false);
                response.put("reason", "too_early");
                response.put("message", "Tracking available from " + trackingStartTime);
                response.put("availableFrom", trackingStartTime);
                return ResponseEntity.ok(response);
            }

            if (now.isAfter(trackingEndTime)) {
                Map<String, Object> response = new HashMap<>();
                response.put("trackingAvailable", false);
                response.put("reason", "too_late");
                response.put("message", "Tracking period ended");
                response.put("endedAt", trackingEndTime);
                return ResponseEntity.ok(response);
            }

            // Tracking is available - return trip and driver info
            Map<String, Object> response = new HashMap<>();
            response.put("trackingAvailable", true);

            // Trip info
            Map<String, Object> tripInfo = new HashMap<>();
            tripInfo.put("id", trip.getId());
            tripInfo.put("status", trip.getStatus());
            tripInfo.put("source", trip.getSource());
            tripInfo.put("destination", trip.getDestination());
            tripInfo.put("sourceLatitude", trip.getSourceLatitude());
            tripInfo.put("sourceLongitude", trip.getSourceLongitude());
            tripInfo.put("destinationLatitude", trip.getDestinationLatitude());
            tripInfo.put("destinationLongitude", trip.getDestinationLongitude());
            tripInfo.put("tripDate", trip.getTripDate());
            tripInfo.put("actualStartTime", trip.getActualStartTime());
            tripInfo.put("actualEndTime", trip.getActualEndTime());
            response.put("trip", tripInfo);

            // Vehicle info
            var vehicle = trip.getVehicle();
            if (vehicle != null) {
                Map<String, Object> vehicleInfo = new HashMap<>();
                vehicleInfo.put("id", vehicle.getId());
                vehicleInfo.put("type", vehicle.getType());
                vehicleInfo.put("vehicleNumber", vehicle.getVehicleNumber());
                response.put("vehicle", vehicleInfo);
            }

            // Driver info
            var driver = trip.getDriver();
            if (driver != null) {
                Map<String, Object> driverInfo = new HashMap<>();
                driverInfo.put("id", driver.getId());
                driverInfo.put("name", driver.getUsername());
                driverInfo.put("email", driver.getEmail());
                driverInfo.put("phone", driver.getMobileNumber());
                // Note: In a real app, you might want to include driver photo URL
                response.put("driver", driverInfo);
            }

            // Booking info
            Map<String, Object> bookingInfo = new HashMap<>();
            bookingInfo.put("id", booking.getId());
            bookingInfo.put("seats", booking.getSeatNumbers());
            bookingInfo.put("pickupLocation", booking.getPickupLoc());
            bookingInfo.put("dropoffLocation", booking.getDropoffLoc());
            response.put("booking", bookingInfo);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get tracking info: " + e.getMessage()));
        }
    }
}
