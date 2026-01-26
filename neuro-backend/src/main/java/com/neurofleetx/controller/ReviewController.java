package com.neurofleetx.controller;

import com.neurofleetx.model.Review;
import com.neurofleetx.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> payload) {
        try {
            Long tripId = ((Number) payload.get("tripId")).longValue();
            Long customerId = ((Number) payload.get("customerId")).longValue();
            Integer rating = ((Number) payload.get("rating")).intValue();
            String feedback = (String) payload.get("feedback");

            Review review = reviewService.submitReview(tripId, customerId, rating, feedback);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Review>> getDriverReviews(@PathVariable Long driverId) {
        return ResponseEntity.ok(reviewService.getDriverReviews(driverId));
    }

    @GetMapping("/driver/{driverId}/rating")
    public ResponseEntity<Double> getDriverRating(@PathVariable Long driverId) {
        return ResponseEntity.ok(reviewService.getDriverRating(driverId));
    }
}
