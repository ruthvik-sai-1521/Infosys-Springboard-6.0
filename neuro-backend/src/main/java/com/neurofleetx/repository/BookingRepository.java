package com.neurofleetx.repository;

import com.neurofleetx.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCustomerIdOrderByIdDesc(Long customerId);

    List<Booking> findByDriverIdOrderByIdDesc(Long driverId);

    List<Booking> findByVehicleIdOrderByIdDesc(Long vehicleId);

    List<Booking> findByTripIdOrderByIdDesc(Long tripId);
}
