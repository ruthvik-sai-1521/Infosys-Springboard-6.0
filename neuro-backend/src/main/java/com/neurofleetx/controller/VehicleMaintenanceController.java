package com.neurofleetx.controller;

import com.neurofleetx.model.MaintenanceAlert;
import com.neurofleetx.model.MaintenanceSchedule;
import com.neurofleetx.model.VehicleHealthHistory;
import com.neurofleetx.service.VehicleMaintenanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin(origins = "*") // Allow requests from frontend
public class VehicleMaintenanceController {

    @Autowired
    private VehicleMaintenanceService maintenanceService;

    // --- Health History Endpoints ---

    @GetMapping("/history/{vehicleId}")
    public ResponseEntity<List<VehicleHealthHistory>> getHealthHistory(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getHealthHistory(vehicleId));
    }

    @GetMapping("/history/{vehicleId}/recent")
    public ResponseEntity<List<VehicleHealthHistory>> getRecentHealthHistory(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getRecentHealthHistory(vehicleId));
    }

    @GetMapping("/history/{vehicleId}/trends")
    public ResponseEntity<List<Map<String, Object>>> getHealthTrends(
            @PathVariable Long vehicleId,
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(maintenanceService.getDailyHealthTrends(vehicleId, days));
    }

    // --- Maintenance Alerts Endpoints ---

    @GetMapping("/alerts/{vehicleId}")
    public ResponseEntity<List<MaintenanceAlert>> getVehicleAlerts(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getAllAlerts(vehicleId));
    }

    @GetMapping("/alerts/{vehicleId}/active")
    public ResponseEntity<List<MaintenanceAlert>> getActiveVehicleAlerts(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getActiveAlerts(vehicleId));
    }

    @PostMapping("/alerts/{alertId}/acknowledge")
    public ResponseEntity<MaintenanceAlert> acknowledgeAlert(
            @PathVariable Long alertId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(maintenanceService.acknowledgeAlert(alertId, userId));
    }

    @PostMapping("/alerts/{alertId}/resolve")
    public ResponseEntity<MaintenanceAlert> resolveAlert(
            @PathVariable Long alertId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(maintenanceService.resolveAlert(alertId, userId));
    }

    @GetMapping("/alerts/summary")
    public ResponseEntity<List<Object[]>> getAlertSummary() {
        return ResponseEntity.ok(maintenanceService.getAlertSummary());
    }

    // --- Maintenance Schedule Endpoints ---

    @GetMapping("/schedules/{vehicleId}")
    public ResponseEntity<List<MaintenanceSchedule>> getSchedules(@PathVariable Long vehicleId) {
        return ResponseEntity.ok(maintenanceService.getSchedules(vehicleId));
    }

    @PostMapping("/schedules")
    public ResponseEntity<MaintenanceSchedule> createSchedule(@RequestBody MaintenanceSchedule schedule) {
        return ResponseEntity.ok(maintenanceService.createSchedule(schedule));
    }

    @PutMapping("/schedules/{scheduleId}/status")
    public ResponseEntity<MaintenanceSchedule> updateScheduleStatus(
            @PathVariable Long scheduleId,
            @RequestParam String status) {
        return ResponseEntity.ok(maintenanceService.updateScheduleStatus(scheduleId, status));
    }
}
