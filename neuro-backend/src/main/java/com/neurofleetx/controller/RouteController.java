package com.neurofleetx.controller;

import com.neurofleetx.service.RouteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController {

    @Autowired
    private RouteService routeService;

    @GetMapping("/suggest")
    public ResponseEntity<?> suggestRoute(@RequestParam String source, @RequestParam String destination) {
        try {
            Map<String, Object> routeDetails = routeService.getOptimalRoute(source, destination);
            return ResponseEntity.ok(routeDetails);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
