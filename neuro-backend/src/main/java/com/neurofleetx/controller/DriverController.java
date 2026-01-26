package com.neurofleetx.controller;

import com.neurofleetx.model.Booking;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import com.neurofleetx.model.Vehicle;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    @Autowired
    private com.neurofleetx.service.JwtService jwtService;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String token) {
        String email = jwtService.extractUsername(token.substring(7));
        return userRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/profile/update")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String token,
            @RequestBody User updatedData) {
        String email = jwtService.extractUsername(token.substring(7));
        return userRepository.findByEmail(email).map(user -> {
            user.setMobileNumber(updatedData.getMobileNumber());
            user.setAadhaarNumber(updatedData.getAadhaarNumber());
            user.setDrivingLicense(updatedData.getDrivingLicense());
            user.setProfileImage(updatedData.getProfileImage());
            user.setVerificationStatus("PENDING_VERIFICATION"); // Reset to pending
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile submitted successfully!"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "User not found")));
    }

    @PostMapping("/profile/image/update")
    public ResponseEntity<?> updateProfileImageOnly(@RequestHeader("Authorization") String token,
            @RequestBody Map<String, String> payload) {
        String email = jwtService.extractUsername(token.substring(7));
        String imageUrl = payload.get("profileImage");
        return userRepository.findByEmail(email).map(user -> {
            user.setProfileImage(imageUrl);
            // Do NOT reset verification status
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Profile image updated successfully!"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "User not found")));
    }

    @GetMapping("/{driverId}/profile")
    public User getDriverProfile(@PathVariable Long driverId) {
        return userRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Driver not found"));
    }

    @PostMapping("/{driverId}/vehicle/add")
    public ResponseEntity<?> addVehicle(@PathVariable Long driverId, @RequestBody Vehicle vehicle) {
        return userRepository.findById(driverId).map(driver -> {
            vehicle.setDriver(driver);
            vehicle.setStatus("PENDING_ADMIN_APPROVAL");
            vehicleRepository.save(vehicle);
            return ResponseEntity.ok(Map.of("message", "Vehicle submitted for verification."));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Driver not found")));
    }

    // Using Bookings as "Trips" for now, or we can add a simple Trip log.
    @PostMapping("/{driverId}/trips/add")
    public ResponseEntity<?> addTrip(@PathVariable Long driverId, @RequestBody Booking trip) {
        // Driver logs a trip (e.g. manual entry)
        return userRepository.findById(driverId).map(driver -> {
            trip.setDriver(driver);
            trip.setStatus("COMPLETED"); // Assuming manual log is for completed trips
            bookingRepository.save(trip);
            return ResponseEntity.ok(Map.of("message", "Trip logged successfully."));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Driver not found")));
    }

    @GetMapping("/{driverId}/trips")
    public List<Booking> getDriverTrips(@PathVariable Long driverId) {
        return bookingRepository.findByDriverId(driverId);
    }

    @GetMapping("/{driverId}/vehicles")
    public List<Vehicle> getDriverVehicles(@PathVariable Long driverId) {
        User driver = userRepository.findById(driverId).orElse(null);
        if (driver == null)
            return List.of();
        return vehicleRepository.findByDriver(driver);
    }

    @Autowired
    private com.neurofleetx.service.FileStorageService fileStorageService;

    @PostMapping("/{driverId}/upload-profile-image")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long driverId,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return userRepository.findById(driverId).map(user -> {
            try {
                String fileUrl = fileStorageService.storeFile(file);
                user.setProfileImage(fileUrl);
                userRepository.save(user);
                return ResponseEntity.ok(Map.of("imageUrl", fileUrl));
            } catch (Exception e) {
                return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload image"));
            }
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "User not found")));
    }

    @Autowired
    private com.neurofleetx.service.ReviewService reviewService;

    @GetMapping("/{driverId}/analytics")
    public Map<String, Object> getDriverAnalytics(@PathVariable Long driverId) {
        List<Booking> trips = bookingRepository.findByDriverId(driverId);
        double earnings = trips.stream().filter(b -> "COMPLETED".equals(b.getStatus())).mapToDouble(Booking::getFare)
                .sum();
        long completedTrips = trips.stream().filter(b -> "COMPLETED".equals(b.getStatus())).count();
        double averageRating = reviewService.getDriverRating(driverId);

        return Map.of(
                "totalTrips", completedTrips,
                "earningsToday", earnings,
                "averageRating", averageRating);
    }
}