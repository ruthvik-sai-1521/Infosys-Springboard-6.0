package com.neurofleetx.controller;

import com.neurofleetx.model.Booking;
import com.neurofleetx.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<List<Booking>> getCustomerBookings(@PathVariable Long customerId) {
        return ResponseEntity.ok(bookingService.getBookingsForCustomer(customerId));
    }

    @GetMapping("/trip/{tripId}")
    public ResponseEntity<List<Booking>> getTripBookings(@PathVariable Long tripId) {
        return ResponseEntity.ok(bookingService.getBookingsForTrip(tripId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }
}
