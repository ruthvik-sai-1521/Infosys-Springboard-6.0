package com.neurofleetx.controller;

import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/manager")
public class FleetManagerController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping("/vehicles/status")
    public List<Vehicle> getFleetStatus() {
        return vehicleRepository.findAll();
    }

    @GetMapping("/vehicles/alerts")
    public List<Vehicle> getMaintenanceAlerts() {
        // Mock logic: return vehicles with > 5000 kms driven or battery < 20
        return vehicleRepository.findAll().stream()
                .filter(v -> (v.getKmsDriven() != null && v.getKmsDriven() > 5000) ||
                        (v.getBatteryLevel() != null && v.getBatteryLevel() < 20))
                .collect(Collectors.toList());
    }

    @PostMapping("/vehicles/relocate")
    public Map<String, String> relocateVehicle(@RequestBody Map<String, Object> relocationRequest) {
        // Stub for relocation logic
        return Map.of("message", "Relocation task assigned for vehicle " + relocationRequest.get("vehicleId"));
    }
}
