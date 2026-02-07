package com.neurofleetx.repository;

import com.neurofleetx.model.MaintenanceThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceThresholdRepository extends JpaRepository<MaintenanceThreshold, Long> {

    // Find active thresholds
    List<MaintenanceThreshold> findByIsActiveTrue();

    // Find by component name
    Optional<MaintenanceThreshold> findByComponentName(String componentName);
}
