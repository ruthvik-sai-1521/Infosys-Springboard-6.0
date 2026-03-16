package com.neurofleetx.service;

import com.neurofleetx.dto.MaintenanceSubmissionDTO;
import com.neurofleetx.model.MaintenanceSubmission;
import com.neurofleetx.model.User;
import com.neurofleetx.model.Vehicle;
import com.neurofleetx.repository.MaintenanceSubmissionRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MaintenanceSubmissionService {

    @Autowired
    private MaintenanceSubmissionRepository submissionRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleHoldService vehicleHoldService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // Directory for storing maintenance images
    private static final String UPLOAD_DIR = "uploads/maintenance/";

    /**
     * Submit maintenance completion with images
     */
    @Transactional
    public MaintenanceSubmission submitMaintenance(
            Long vehicleId,
            Long driverId,
            MaintenanceSubmissionDTO dto,
            List<MultipartFile> images) throws IOException {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        // Check if vehicle is on hold
        if (!"ON_HOLD".equals(vehicle.getHoldStatus())) {
            throw new RuntimeException("Vehicle is not on hold. Submission not required.");
        }

        // Check if already has pending submission
        if (submissionRepository.existsByVehicleIdAndStatus(
                vehicleId, MaintenanceSubmission.SubmissionStatus.PENDING)) {
            throw new RuntimeException("A pending submission already exists for this vehicle");
        }

        // Upload images and get URLs
        List<String> imageUrls = uploadImages(images, vehicleId);

        // Create submission
        MaintenanceSubmission submission = new MaintenanceSubmission();
        submission.setVehicle(vehicle);
        submission.setDriver(driver);
        submission.setMaintenanceDate(dto.getMaintenanceDate());
        submission.setDescription(dto.getDescription());
        submission.setImageUrlsList(imageUrls);
        submission.setSubmissionDate(LocalDateTime.now());
        submission.setStatus(MaintenanceSubmission.SubmissionStatus.PENDING);

        MaintenanceSubmission saved = submissionRepository.save(submission);

        // Update vehicle status to PENDING_RELEASE
        vehicle.setHoldStatus("PENDING_RELEASE");
        vehicleRepository.save(vehicle);

        System.out.println("M aintenance submission created: " + saved.getId() +
                " for vehicle " + vehicleId);

        // Notify managers
        notifyManagersNewSubmission(saved);

        return saved;
    }

    /**
     * Manager reviews and approves/rejects submission
     */
    @Transactional
    public MaintenanceSubmission reviewSubmission(
            Long submissionId,
            Long managerId,
            boolean approved,
            String notes) {

        MaintenanceSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        User manager = userRepository.findById(managerId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        if (submission.getStatus() != MaintenanceSubmission.SubmissionStatus.PENDING) {
            throw new RuntimeException("Submission has already been reviewed");
        }

        submission.setReviewedBy(manager);
        submission.setReviewedAt(LocalDateTime.now());
        submission.setReviewNotes(notes);

        if (approved) {
            submission.setStatus(MaintenanceSubmission.SubmissionStatus.APPROVED);
            // Release vehicle from hold
            vehicleHoldService.releaseVehicle(submission.getVehicle().getId(), managerId);
            System.out.println("Submission approved - Vehicle released");
        } else {
            submission.setStatus(MaintenanceSubmission.SubmissionStatus.REJECTED);
            // Keep vehicle on hold
            Vehicle vehicle = submission.getVehicle();
            vehicle.setHoldStatus("ON_HOLD");
            vehicleRepository.save(vehicle);
            System.out.println("Submission rejected - Vehicle remains on hold");
        }

        MaintenanceSubmission saved = submissionRepository.save(submission);

        // Notify driver of decision
        notifyDriverSubmissionReviewed(saved, approved);

        return saved;
    }

    /**
     * Get all pending submissions for manager review
     */
    public List<MaintenanceSubmission> getPendingSubmissions() {
        return submissionRepository.findByStatusOrderBySubmissionDateDesc(
                MaintenanceSubmission.SubmissionStatus.PENDING);
    }

    /**
     * Get submissions by driver
     */
    public List<MaintenanceSubmission> getDriverSubmissions(Long driverId) {
        return submissionRepository.findByDriverIdOrderBySubmissionDateDesc(driverId);
    }

    /**
     * Get submissions by vehicle
     */
    public List<MaintenanceSubmission> getVehicleSubmissions(Long vehicleId) {
        return submissionRepository.findByVehicleIdOrderBySubmissionDateDesc(vehicleId);
    }

    /**
     * Upload images and return list of URLs
     */
    private List<String> uploadImages(List<MultipartFile> images, Long vehicleId) throws IOException {
        List<String> urls = new ArrayList<>();

        if (images == null || images.isEmpty()) {
            return urls;
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        for (MultipartFile image : images) {
            if (image.isEmpty()) {
                continue;
            }

            // Generate unique filename
            String originalFilename = image.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "vehicle_" + vehicleId + "_" + UUID.randomUUID() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.write(filePath, image.getBytes());

            // Store relative path
            urls.add(UPLOAD_DIR + filename);

            System.out.println("Uploaded image: " + filename);
        }

        return urls;
    }

    /**
     * Notify managers of new submission via WebSocket
     */
    private void notifyManagersNewSubmission(MaintenanceSubmission submission) {
        if (messagingTemplate == null) {
            return;
        }

        try {
            java.util.Map<String, Object> notification = java.util.Map.of(
                    "type", "NEW_MAINTENANCE_SUBMISSION",
                    "submissionId", submission.getId(),
                    "vehicleId", submission.getVehicle().getId(),
                    "vehicleNumber", submission.getVehicle().getVehicleNumber(),
                    "driverName", submission.getDriver().getUsername(),
                    "submissionDate", submission.getSubmissionDate().toString(),
                    "message", "New maintenance submission pending review",
                    "timestamp", System.currentTimeMillis());

            // Broadcast to all managers
            messagingTemplate.convertAndSend("/topic/maintenance/submissions", (Object) notification);

            System.out.println("Manager notification sent for submission " + submission.getId());
        } catch (Exception e) {
            System.err.println("Error sending manager notification: " + e.getMessage());
        }
    }

    /**
     * Notify driver of submission review result
     */
    private void notifyDriverSubmissionReviewed(MaintenanceSubmission submission, boolean approved) {
        if (messagingTemplate == null || submission.getDriver() == null) {
            return;
        }

        try {
            String message = approved
                    ? "Your maintenance submission has been approved. Vehicle is now available for trips."
                    : "Your maintenance submission was rejected. Please correct and resubmit.";

            java.util.Map<String, Object> notification = java.util.Map.of(
                    "type", "SUBMISSION_REVIEWED",
                    "submissionId", submission.getId(),
                    "vehicleId", submission.getVehicle().getId(),
                    "vehicleNumber", submission.getVehicle().getVehicleNumber(),
                    "approved", approved,
                    "reviewNotes", submission.getReviewNotes() != null ? submission.getReviewNotes() : "",
                    "message", message,
                    "timestamp", System.currentTimeMillis());

            // Send to driver
            messagingTemplate.convertAndSend(
                    "/topic/notifications/driver/" + submission.getDriver().getId(),
                    (Object) notification);
            System.out.println("Driver notification sent for submission " + submission.getId());
        } catch (Exception e) {
            System.err.println("Error sending driver notification: " + e.getMessage());
        }
    }
}
