package com.neurofleetx.controller;

import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    // --- User Management ---

    @GetMapping("/users")
    public List<User> getUsers(@RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        if (status != null && role != null) {
            return userRepository.findByRole(role).stream()
                    .filter(u -> status.equals(u.getVerificationStatus()))
                    .collect(Collectors.toList());
        }
        if (status != null) {
            return userRepository.findByVerificationStatus(status);
        }
        if (role != null) {
            return userRepository.findByRole(role);
        }
        return userRepository.findAll();
    }

    @PostMapping("/user/{id}/verify")
    public ResponseEntity<?> verifyUser(@PathVariable Long id, @RequestParam String status) {
        // status: APPROVED or REJECTED
        return userRepository.findById(id).map(user -> {
            user.setVerificationStatus(status);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User status updated to " + status));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Vehicle Management ---

    @GetMapping("/vehicles")
    public List<Vehicle> getVehicles(@RequestParam(required = false) String status) {
        if (status != null) {
            return vehicleRepository.findByStatus(status);
        }
        return vehicleRepository.findAll();
    }

    @PostMapping("/vehicle/{id}/verify")
    public ResponseEntity<?> verifyVehicle(@PathVariable Long id, @RequestParam String status) {
        // status: APPROVED or REJECTED
        return vehicleRepository.findById(id).map(vehicle -> {
            vehicle.setStatus(status);
            vehicleRepository.save(vehicle);
            return ResponseEntity.ok(Map.of("message", "Vehicle status updated to " + status));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- Specific Verification Endpoints for UI ---

    @GetMapping("/verify/drivers")
    public List<User> getPendingDrivers() {
        return userRepository.findByVerificationStatus("PENDING_VERIFICATION");
    }

    @GetMapping("/verify/vehicles")
    public List<Vehicle> getPendingVehicles() {
        return vehicleRepository.findByStatus("PENDING_ADMIN_APPROVAL");
    }

    // --- Dashboard Stats ---
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalVehicles", vehicleRepository.count());
        stats.put("pendingDrivers", userRepository.findByVerificationStatus("PENDING_VERIFICATION").size());
        stats.put("pendingVehicles", vehicleRepository.findByStatus("PENDING_ADMIN_APPROVAL").size());

        long activeBookings = bookingRepository.findAll().stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getStatus())
                        || "IN_PROGRESS".equalsIgnoreCase(b.getStatus()))
                .count();
        stats.put("activeBookings", activeBookings);

        return ResponseEntity.ok(stats);
    }
}
