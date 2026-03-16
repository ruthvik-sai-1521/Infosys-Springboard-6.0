package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@Table(name = "maintenance_submissions")
public class MaintenanceSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne
    @JoinColumn(name = "driver_id", nullable = false)
    private User driver;

    @Column(name = "submission_date", nullable = false)
    private LocalDateTime submissionDate;

    @Column(name = "maintenance_date", nullable = false)
    private LocalDate maintenanceDate;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Store as comma-separated list of image paths
    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private SubmissionStatus status = SubmissionStatus.PENDING;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // Helper methods for image URLs
    public List<String> getImageUrlsList() {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return java.util.Collections.emptyList();
        }
        return java.util.Arrays.asList(imageUrls.split(","));
    }

    public void setImageUrlsList(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            this.imageUrls = "";
        } else {
            this.imageUrls = String.join(",", urls);
        }
    }

    public enum SubmissionStatus {
        PENDING, // Awaiting manager review
        APPROVED, // Manager approved, vehicle released
        REJECTED // Manager rejected, vehicle remains on hold
    }
}
