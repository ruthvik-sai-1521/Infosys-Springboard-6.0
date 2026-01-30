package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password;
    private String role;

    // Driver Profile Details
    @Column(name = "mobile_number")
    private String mobileNumber;

    @Column(name = "driving_license", columnDefinition = "TEXT")
    private String drivingLicense; // Stores the PATH to the file (e.g., /uploads/img.jpg)

    @Column(name = "aadhaar_number")
    private String aadhaarNumber;

    @Column(name = "profile_image", columnDefinition = "TEXT")
    private String profileImage; // Stores the PATH to the file

    // Status: PENDING, APPROVED, REJECTED
    @Column(name = "verification_status")
    private String verificationStatus = "NOT_SUBMITTED";

    // Ratings
    @Column(name = "average_rating")
    private Double averageRating = 0.0;

    @Column(name = "rating_count")
    private Integer ratingCount = 0;

    // Manager Specific Details
    @Column(name = "emp_id")
    private String empId;

    @Column(name = "branch")
    private String branch;

    // Driver Statistics
    @Column(name = "total_earnings")
    private Double totalEarnings = 0.0;

    @Column(name = "pending_earnings")
    private Double pendingEarnings = 0.0;

    @Column(name = "completed_trips_count")
    private Integer completedTripsCount = 0;

    // Driver Location & Status
    @Column(name = "current_latitude")
    private Double currentLatitude;

    @Column(name = "current_longitude")
    private Double currentLongitude;

    @Column(name = "is_online")
    private Boolean isOnline = false;

    @Column(name = "last_online_at")
    private LocalDateTime lastOnlineAt;

    @Column(name = "current_trip_id")
    private Long currentTripId;
}