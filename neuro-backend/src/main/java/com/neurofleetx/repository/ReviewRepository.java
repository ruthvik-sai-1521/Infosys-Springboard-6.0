package com.neurofleetx.repository;

import com.neurofleetx.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByDriverIdOrderByIdDesc(Long driverId);

    List<Review> findByCustomerIdOrderByIdDesc(Long customerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.driver.id = :driverId")
    Double getAverageRatingForDriver(Long driverId);
}
