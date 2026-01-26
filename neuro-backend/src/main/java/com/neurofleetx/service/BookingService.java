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

        int seatsNeeded = seatNumbers.size();

        if (trip.getAvailableSeats() < seatsNeeded) {
            throw new RuntimeException("Not enough seats available");
        }

        // Check availability of specific seats
        List<Booking> existingBookings = bookingRepository.findByTripId(tripId);
        for (Booking b : existingBookings) {
            String booked = b.getSeatNumbers();
            if (booked != null) {
                for (String s : seatNumbers) {
                    if (booked.contains(s)) {
                        // Simple contains check might fail for "1" vs "11", but assuming single digits
                        // or clear separation logic is acceptable for MVP
                        // Better: split by comma and check
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

        // Deduct seats
        trip.setAvailableSeats(trip.getAvailableSeats() - seatsNeeded);
        tripRepository.save(trip);

        // Create booking
        Booking booking = new Booking();
        booking.setTrip(trip);
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));
        booking.setCustomer(customer);
        booking.setSeatsBooked(seatsNeeded);
        booking.setSeatNumbers(String.join(",", seatNumbers));
        booking.setFare(trip.getFare() * seatsNeeded);
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
        return bookingRepository.findByTripId(tripId);
    }

    public List<Booking> getBookingsForCustomer(Long customerId) {
        return bookingRepository.findByCustomerId(customerId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}
