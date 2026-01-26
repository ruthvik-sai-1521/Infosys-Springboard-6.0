package com.neurofleetx.controller;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping("/vehicles/search")
    public List<Vehicle> searchVehicles(
            @RequestParam(required = false) String pickup,
            @RequestParam(required = false) String dropoff) {

        // In a real app, filter by location proximity.
        // For now, return all AVAILABLE vehicles, possibly filtered by
        // "currentLocation" if we had that logic.
        return vehicleRepository.findAll().stream()
                .filter(v -> "AVAILABLE".equalsIgnoreCase(v.getStatus()))
                .collect(Collectors.toList());
    }
}
