package com.neurofleetx.repository;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByDriver(User driver);

    List<Vehicle> findByStatus(String status);
}