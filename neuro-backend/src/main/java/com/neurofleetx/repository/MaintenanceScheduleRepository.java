package com.neurofleetx.repository;

import com.neurofleetx.model.MaintenanceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

import java.util.List;

@Repository
public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, Long> {

    // 1. Find schedules by vehicleId ordered by date (Already had this variant,
    // refining)
    List<MaintenanceSchedule> findByVehicleIdOrderByScheduledDateAsc(Long vehicleId);

    // 2. Find schedules by status
    List<MaintenanceSchedule> findByStatus(MaintenanceSchedule.ScheduleStatus status);

    // 3. Find overdue schedules (date < today AND status IN (PENDING, SCHEDULED))
    @Query("SELECT m FROM MaintenanceSchedule m WHERE m.scheduledDate < CURRENT_DATE AND m.status IN ('PENDING', 'SCHEDULED', 'OVERDUE')")
    List<MaintenanceSchedule> findOverdueSchedules();

    // Find active schedules for a vehicle (excluding completed/cancelled)
    List<MaintenanceSchedule> findByVehicleIdAndStatusNot(Long vehicleId, MaintenanceSchedule.ScheduleStatus status);

    // 4. Find upcoming schedules for a driver (Join via Vehicle)
    List<MaintenanceSchedule> findByVehicleDriverIdAndStatusOrderByScheduledDateAsc(Long driverId,
            MaintenanceSchedule.ScheduleStatus status);

    // 5. Find schedules within a date range
    List<MaintenanceSchedule> findByScheduledDateBetweenOrderByScheduledDateAsc(LocalDate startDate, LocalDate endDate);
}
