package com.neurofleetx.controller;

import com.neurofleetx.model.Trip;
import com.neurofleetx.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
@CrossOrigin(origins = "*") // Update with specific frontend URL in production
public class TripController {

    @Autowired
    private TripService tripService;

    @PostMapping("/create")
    public ResponseEntity<Trip> createTrip(@RequestBody com.neurofleetx.dto.TripRequest request) {
        Trip createdTrip = tripService.createTrip(request);
        return ResponseEntity.ok(createdTrip);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Trip>> searchTrips(@RequestParam String source, @RequestParam String destination) {
        List<Trip> trips = tripService.searchTrips(source, destination);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Trip>> getDriverTrips(@PathVariable Long driverId) {
        List<Trip> trips = tripService.getDriverTrips(driverId);
        return ResponseEntity.ok(trips);
    }

    @GetMapping("/all")
    public ResponseEntity<List<Trip>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<Trip> startTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.startTrip(id));
    }

    @PostMapping("/{id}/end")
    public ResponseEntity<Trip> endTrip(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.endTrip(id));
    }
}
