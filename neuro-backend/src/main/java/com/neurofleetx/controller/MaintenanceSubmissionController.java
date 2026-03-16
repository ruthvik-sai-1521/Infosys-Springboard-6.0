package com.neurofleetx.controller;

import com.neurofleetx.dto.MaintenanceSubmissionDTO;
import com.neurofleetx.model.MaintenanceSubmission;
import com.neurofleetx.service.MaintenanceSubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin(origins = "*")
public class MaintenanceSubmissionController {

    @Autowired
    private MaintenanceSubmissionService submissionService;

    /**
     * Driver submits maintenance completion with images
     */
    @PostMapping("/submit")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<?> submitMaintenance(
            @RequestParam Long vehicleId,
            @RequestParam Long driverId,
            @RequestParam String maintenanceDate,
            @RequestParam(required = false) String description,
            @RequestParam(value = "images", required = false) List<MultipartFile> images) {

        try {
            // Parse maintenance date
            LocalDate date = LocalDate.parse(maintenanceDate);

            // Create DTO
            MaintenanceSubmissionDTO dto = new MaintenanceSubmissionDTO();
            dto.setVehicleId(vehicleId);
            dto.setMaintenanceDate(date);
            dto.setDescription(description);

            // Submit maintenance
            MaintenanceSubmission submission = submissionService.submitMaintenance(
                    vehicleId, driverId, dto, images);

            return ResponseEntity.ok(Map.of(
                    "message", "Maintenance submission successful",
                    "submissionId", submission.getId(),
                    "status", submission.getStatus()));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload images: " + e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get driver's submission history
     */
    @GetMapping("/my-submissions")
    @PreAuthorize("hasRole('DRIVER')")
    public ResponseEntity<List<MaintenanceSubmission>> getMySubmissions(@RequestParam Long driverId) {
        List<MaintenanceSubmission> submissions = submissionService.getDriverSubmissions(driverId);
        return ResponseEntity.ok(submissions);
    }

    /**
     * Get pending submissions for manager review
     */
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<List<MaintenanceSubmission>> getPendingSubmissions() {
        List<MaintenanceSubmission> submissions = submissionService.getPendingSubmissions();
        return ResponseEntity.ok(submissions);
    }

    /**
     * Manager approves a submission
     */
    @PostMapping("/{submissionId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> approveSubmission(
            @PathVariable Long submissionId,
            @RequestParam Long managerId,
            @RequestParam(required = false) String notes) {

        try {
            MaintenanceSubmission submission = submissionService.reviewSubmission(
                    submissionId, managerId, true, notes);

            return ResponseEntity.ok(Map.of(
                    "message", "Submission approved successfully",
                    "submissionId", submission.getId(),
                    "status", submission.getStatus()));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Manager rejects a submission
     */
    @PostMapping("/{submissionId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<?> rejectSubmission(
            @PathVariable Long submissionId,
            @RequestParam Long managerId,
            @RequestParam(required = false) String notes) {

        try {
            MaintenanceSubmission submission = submissionService.reviewSubmission(
                    submissionId, managerId, false, notes);

            return ResponseEntity.ok(Map.of(
                    "message", "Submission rejected",
                    "submissionId", submission.getId(),
                    "status", submission.getStatus()));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get submissions for a specific vehicle
     */
    @GetMapping("/vehicle/{vehicleId}")
    @PreAuthorize("hasAnyRole('DRIVER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<List<MaintenanceSubmission>> getVehicleSubmissions(@PathVariable Long vehicleId) {
        List<MaintenanceSubmission> submissions = submissionService.getVehicleSubmissions(vehicleId);
        return ResponseEntity.ok(submissions);
    }
}
