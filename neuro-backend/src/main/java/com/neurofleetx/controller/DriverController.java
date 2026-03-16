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

    @PostMapping(value = "/{driverId}/vehicle/add", consumes = "multipart/form-data")
    public ResponseEntity<?> addVehicleWithDocuments(
            @PathVariable Long driverId,
            @RequestParam("vehicleNumber") String vehicleNumber,
            @RequestParam("type") String type,
            @RequestParam(value = "seatCount", defaultValue = "5") Integer seatCount,
            @RequestParam(value = "fuelLevel", defaultValue = "100") Integer fuelLevel,
            @RequestParam(value = "kmsDriven", defaultValue = "0") Integer kmsDriven,
            @RequestParam(value = "mileage", defaultValue = "0") Double mileage,
            @RequestParam(value = "fuelCapacity", defaultValue = "0") Double fuelCapacity,
            @RequestParam(value = "rcFile", required = false) org.springframework.web.multipart.MultipartFile rcFile,
            @RequestParam(value = "insuranceFile", required = false) org.springframework.web.multipart.MultipartFile insuranceFile) {

        return userRepository.findById(driverId).map(driver -> {
            try {
                Vehicle vehicle = new Vehicle();
                vehicle.setDriver(driver);
                vehicle.setVehicleNumber(vehicleNumber);
                vehicle.setType(type);
                vehicle.setSeatCount(seatCount);
                vehicle.setFuelLevel(fuelLevel);
                vehicle.setKmsDriven(kmsDriven);
                vehicle.setMileage(mileage);
                vehicle.setFuelCapacity(fuelCapacity);
                vehicle.setStatus("PENDING_ADMIN_APPROVAL");

                if (rcFile != null && !rcFile.isEmpty()) {
                    vehicle.setRcPdfUrl(fileStorageService.storeFile(rcFile));
                }
                if (insuranceFile != null && !insuranceFile.isEmpty()) {
                    vehicle.setInsurancePdfUrl(fileStorageService.storeFile(insuranceFile));
                }

                vehicleRepository.save(vehicle);
                return ResponseEntity.ok(Map.of("message", "Vehicle submitted for admin verification."));
            } catch (Exception e) {
                return ResponseEntity.internalServerError()
                        .body(Map.of("error", "Failed to add vehicle: " + e.getMessage()));
            }
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Driver not found")));
    }

    /** Fallback JSON endpoint kept for backward compatibility */
    @PostMapping(value = "/{driverId}/vehicle/add", consumes = "application/json")
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

    @GetMapping("/{driverId}/bookings")
    public List<Booking> getDriverBookings(@PathVariable Long driverId) {
        return bookingRepository.findByDriverIdOrderByIdDesc(driverId);
    }

    // Restore this endpoint for frontend compatibility
    @GetMapping("/{driverId}/trips")
    public List<Booking> getDriverTrips(@PathVariable Long driverId) {
        return bookingRepository.findByDriverIdOrderByIdDesc(driverId);
    }

    // --- REVENUE & ANALYTICS --- //

    @GetMapping("/{driverId}/revenue")
    public ResponseEntity<Map<String, Object>> getDriverRevenue(@PathVariable Long driverId) {
        List<Booking> trips = bookingRepository.findByDriverIdOrderByIdDesc(driverId);
        double totalRevenue = trips.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()))
                .mapToDouble(Booking::getFare)
                .sum();
        return ResponseEntity.ok(Map.of("totalRevenue", totalRevenue));
    }

    @GetMapping("/{driverId}/vehicles")
    public List<Vehicle> getDriverVehicles(@PathVariable Long driverId) {
        // Use ID directly for robustness
        return vehicleRepository.findByDriverId(driverId);
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
        List<Booking> trips = bookingRepository.findByDriverIdOrderByIdDesc(driverId);
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