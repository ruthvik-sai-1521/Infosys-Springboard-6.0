package com.neurofleetx.controller;

import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    @Autowired
    private VehicleRepository vehicleRepository;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    private final Map<Long, ScheduledFuture<?>> activeSimulations = new ConcurrentHashMap<>();
    private final Random random = new Random();

    @PostMapping("/start/{vehicleId}")
    public ResponseEntity<?> startSimulation(@PathVariable Long vehicleId) {
        if (activeSimulations.containsKey(vehicleId)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Simulation already running for this vehicle"));
        }

        ScheduledFuture<?> task = scheduler.scheduleAtFixedRate(() -> updateVehicleParams(vehicleId), 0, 2,
                TimeUnit.SECONDS);
        activeSimulations.put(vehicleId, task);

        return ResponseEntity.ok(Map.of("message", "Simulation started", "status", "RUNNING"));
    }

    @PostMapping("/stop/{vehicleId}")
    public ResponseEntity<?> stopSimulation(@PathVariable Long vehicleId) {
        ScheduledFuture<?> task = activeSimulations.remove(vehicleId);
        if (task != null) {
            task.cancel(false);
            return ResponseEntity.ok(Map.of("message", "Simulation stopped"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "No active simulation found"));
    }

    private void updateVehicleParams(Long vehicleId) {
        vehicleRepository.findById(vehicleId).ifPresent(vehicle -> {
            // Update Fuel (Assume decrease)
            int currentFuel = vehicle.getFuelLevel() != null ? vehicle.getFuelLevel() : 100;
            if (currentFuel > 0)
                vehicle.setFuelLevel(currentFuel - 1);

            // Update Odometer (Assume increase)
            int currentKms = vehicle.getKmsDriven() != null ? vehicle.getKmsDriven() : 0;
            vehicle.setKmsDriven(currentKms + random.nextInt(5)); // Add 0-5 kms

            // Update Location (Mock Movement - random jitter around Bangalore)
            // Base: 12.9716, 77.5946
            double lat = 12.9716 + (random.nextDouble() - 0.5) * 0.1;
            double lng = 77.5946 + (random.nextDouble() - 0.5) * 0.1;
            vehicle.setCurrentLocation(String.format("%.4f, %.4f", lat, lng));

            vehicleRepository.save(vehicle);
        });
    }
}
