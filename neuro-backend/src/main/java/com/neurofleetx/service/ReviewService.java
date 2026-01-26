package com.neurofleetx.service;

import com.neurofleetx.model.Review;
import com.neurofleetx.model.Trip;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.ReviewRepository;
import com.neurofleetx.repository.TripRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private UserRepository userRepository;

    public Review submitReview(Long tripId, Long customerId, Integer rating, String feedback) {
        Trip trip = tripRepository.findById(tripId).orElseThrow(() -> new RuntimeException("Trip not found"));
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Review review = new Review();
        review.setTrip(trip);
        review.setDriver(trip.getDriver());
        review.setCustomer(customer);
        review.setRating(rating);
        review.setFeedback(feedback);
        review.setCreatedAt(LocalDateTime.now());

        return reviewRepository.save(review);
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public List<Review> getDriverReviews(Long driverId) {
        return reviewRepository.findByDriverId(driverId);
    }

    public Double getDriverRating(Long driverId) {
        Double avg = reviewRepository.getAverageRatingForDriver(driverId);
        return avg != null ? avg : 0.0;
    }
}
