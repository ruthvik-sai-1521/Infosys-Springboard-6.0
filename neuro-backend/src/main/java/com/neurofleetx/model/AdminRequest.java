package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "admin_requests")
public class AdminRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "sender_role")
    private String senderRole = "MANAGER";

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver; // Can be null for broadcast to all admins

    @Column(name = "receiver_role")
    private String receiverRole = "ADMIN";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestType type;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String response;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum RequestType {
        INQUIRY,
        VEHICLE_REQUEST,
        DRIVER_ISSUE,
        FEEDBACK
    }

    public enum RequestStatus {
        PENDING,
        READ,
        RESPONDED
    }
}
