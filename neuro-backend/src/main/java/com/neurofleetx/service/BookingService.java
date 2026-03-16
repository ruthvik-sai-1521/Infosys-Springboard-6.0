package com.neurofleetx.service;

import com.neurofleetx.model.Booking;
import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.TripRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public Booking bookTrip(Long tripId, Long customerId, List<String> seatNumbers) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        // When seat selection is disabled, treat as 1 seat booking
        java.util.List<String> safeSeats = (seatNumbers != null) ? seatNumbers : java.util.List.of();
        boolean noSeatSelection = safeSeats.isEmpty();
        int seatsNeeded = noSeatSelection ? 1 : safeSeats.size();

        if (trip.getAvailableSeats() < seatsNeeded) {
            throw new RuntimeException("Not enough seats available");
        }

        // Check for duplicate seat conflicts (only when specific seats are selected)
        if (!noSeatSelection) {
            List<Booking> existingBookings = bookingRepository.findByTripIdOrderByIdDesc(tripId);
            for (Booking b : existingBookings) {
                String booked = b.getSeatNumbers();
                if (booked != null) {
                    for (String s : safeSeats) {
                        String[] taken = booked.split(",");
                        for (String take : taken) {
                            if (take.trim().equals(s.trim())) {
                                throw new RuntimeException("Seat " + s + " is already booked.");
                            }
                        }
                    }
                }
            }
        }

        // Deduct seats from available count
        trip.setAvailableSeats(trip.getAvailableSeats() - seatsNeeded);
        tripRepository.save(trip);

        // Calculate fare — use trip.getFare() directly (already computed per-trip on
        // creation)
        double bookingFare = trip.getFare() != null ? trip.getFare() : 0.0;

        // Create booking
        Booking booking = new Booking();
        booking.setTrip(trip);
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        booking.setCustomer(customer);
        booking.setSeatsBooked(seatsNeeded);
        booking.setSeatNumbers(noSeatSelection ? "" : String.join(",", safeSeats));
        booking.setFare(bookingFare);
        booking.setStatus("CONFIRMED");
        booking.setBookingTime(LocalDateTime.now());

        // Populate legacy/convenience fields
        booking.setDriver(trip.getDriver());
        booking.setVehicle(trip.getVehicle());
        booking.setPickupLoc(trip.getSource());
        booking.setDropoffLoc(trip.getDestination());

        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsForTrip(Long tripId) {
        return bookingRepository.findByTripIdOrderByIdDesc(tripId);
    }

    public List<Booking> getCustomerBookings(Long customerId) {
        return bookingRepository.findByCustomerIdOrderByIdDesc(customerId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll(
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"));
    }

    public Booking getBookingById(Long bookingId) {
        return bookingRepository.findById(bookingId).orElse(null);
    }
}
