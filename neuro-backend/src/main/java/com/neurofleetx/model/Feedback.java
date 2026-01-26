package com.neurofleetx.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "feedbacks")
public class Feedback {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer rating; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @OneToOne
    @JoinColumn(name = "booking_id", unique = true)
    private Booking booking;
}
