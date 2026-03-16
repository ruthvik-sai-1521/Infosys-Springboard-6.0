package com.neurofleetx.repository;

import com.neurofleetx.model.MaintenanceSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceSubmissionRepository extends JpaRepository<MaintenanceSubmission, Long> {

    // Find all pending submissions for manager review
    List<MaintenanceSubmission> findByStatusOrderBySubmissionDateDesc(MaintenanceSubmission.SubmissionStatus status);

    // Find submissions by driver
    List<MaintenanceSubmission> findByDriverIdOrderBySubmissionDateDesc(Long driverId);

    // Find submissions by vehicle
    List<MaintenanceSubmission> findByVehicleIdOrderBySubmissionDateDesc(Long vehicleId);

    // Find pending submissions for a specific vehicle
    List<MaintenanceSubmission> findByVehicleIdAndStatus(Long vehicleId, MaintenanceSubmission.SubmissionStatus status);

    // Check if vehicle has pending submission
    boolean existsByVehicleIdAndStatus(Long vehicleId, MaintenanceSubmission.SubmissionStatus status);
}
