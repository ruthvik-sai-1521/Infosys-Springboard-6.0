package com.neurofleetx.scheduler;

import com.neurofleetx.service.TripService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for automatic trip management
 */
@Component
public class TripScheduler {

    @Autowired
    private TripService tripService;

    /**
     * Auto-end trips that have exceeded their scheduled duration
     * Runs every 5 minutes (300,000 milliseconds)
     */
    @Scheduled(fixedRate = 300000)
    public void checkAndAutoEndTrips() {
        System.out.println("Running scheduled task: Auto-ending overdue trips...");
        tripService.autoEndTrips();
    }
}
