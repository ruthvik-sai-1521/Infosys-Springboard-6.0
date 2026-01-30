package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "messages")
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}
