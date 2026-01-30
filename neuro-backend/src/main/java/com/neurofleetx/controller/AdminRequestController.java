package com.neurofleetx.controller;

import com.neurofleetx.model.AdminRequest;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.AdminRequestRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin-requests")
@CrossOrigin(origins = "*")
public class AdminRequestController {

    @Autowired
    private AdminRequestRepository adminRequestRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new request from manager to admin
     */
    @PostMapping("/create")
    public ResponseEntity<AdminRequest> createRequest(@RequestBody Map<String, Object> requestData) {
        try {
            Long senderId = Long.valueOf(requestData.get("senderId").toString());
            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender not found"));

            AdminRequest request = new AdminRequest();
            request.setSender(sender);
            request.setSenderRole("MANAGER");
            request.setReceiverRole("ADMIN");

            // Type
            String typeStr = requestData.get("type").toString();
            request.setType(AdminRequest.RequestType.valueOf(typeStr.toUpperCase()));

            // Subject and message
            request.setSubject(requestData.get("subject").toString());
            request.setMessage(requestData.get("message").toString());

            // Status
            request.setStatus(AdminRequest.RequestStatus.PENDING);

            AdminRequest saved = adminRequestRepository.save(request);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all requests sent by a manager
     */
    @GetMapping("/my-requests/{managerId}")
    public ResponseEntity<List<AdminRequest>> getMyRequests(@PathVariable Long managerId) {
        List<AdminRequest> requests = adminRequestRepository.findBySenderIdOrderByCreatedAtDesc(managerId);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get all requests for admin (inbox)
     */
    @GetMapping("/inbox/{adminId}")
    public ResponseEntity<List<AdminRequest>> getAdminInbox(@PathVariable Long adminId) {
        List<AdminRequest> requests = adminRequestRepository
                .findByReceiverIdOrReceiverIsNullOrderByCreatedAtDesc(adminId);
        return ResponseEntity.ok(requests);
    }

    /**
     * Get all pending requests
     */
    @GetMapping("/pending")
    public ResponseEntity<List<AdminRequest>> getPendingRequests() {
        List<AdminRequest> requests = adminRequestRepository
                .findByStatusOrderByCreatedAtDesc(AdminRequest.RequestStatus.PENDING);
        return ResponseEntity.ok(requests);
    }

    /**
     * Mark request as read
     */
    @PutMapping("/{id}/mark-read")
    public ResponseEntity<AdminRequest> markAsRead(@PathVariable Long id) {
        AdminRequest request = adminRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setStatus(AdminRequest.RequestStatus.READ);
        AdminRequest updated = adminRequestRepository.save(request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Admin responds to request
     */
    @PutMapping("/{id}/respond")
    public ResponseEntity<AdminRequest> respondToRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> responseData) {

        AdminRequest request = adminRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        request.setResponse(responseData.get("response"));
        request.setStatus(AdminRequest.RequestStatus.RESPONDED);
        request.setRespondedAt(LocalDateTime.now());

        AdminRequest updated = adminRequestRepository.save(request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a request
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        adminRequestRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
