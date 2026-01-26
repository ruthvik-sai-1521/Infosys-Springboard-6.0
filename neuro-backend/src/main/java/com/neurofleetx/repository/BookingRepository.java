package com.neurofleetx.repository;

import com.neurofleetx.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerId(Long customerId);

    List<Booking> findByDriverId(Long driverId);

    List<Booking> findByVehicleId(Long vehicleId);

    List<Booking> findByTripId(Long tripId);
}
