package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "bookings")
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pickup_loc")
    private String pickupLoc;

    @Column(name = "dropoff_loc")
    private String dropoffLoc;

    private Double fare;

    // PENDING, CONFIRMED, COMPLETED, CANCELLED
    private String status;

    @Column(name = "booking_time")
    private LocalDateTime bookingTime;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne
    @JoinColumn(name = "driver_id")
    private User driver;

    @ManyToOne
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(name = "seats_booked")
    private Integer seatsBooked;

    @Column(name = "seat_numbers")
    private String seatNumbers; // stored as "1,2,3"
}
