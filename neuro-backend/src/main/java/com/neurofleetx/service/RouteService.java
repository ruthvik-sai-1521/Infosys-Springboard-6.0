package com.neurofleetx.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RouteService {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${google.maps.api.key}") // Ensure this is in property file or env
    private String apiKey;

    private static final String ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

    public Map<String, Object> getOptimalRoute(String origin, String destination) {
        // Construct Request Body for computeRoutes
        Map<String, Object> requestBody = new HashMap<>();

        // Origin & Destination
        Map<String, Object> originLoc = Map.of("address", origin);
        Map<String, Object> destLoc = Map.of("address", destination);

        requestBody.put("origin", originLoc);
        requestBody.put("destination", destLoc);
        requestBody.put("travelMode", "DRIVE");
        requestBody.put("routingPreference", "TRAFFIC_AWARE_OPTIMAL");
        requestBody.put("computeAlternativeRoutes", false);

        // Request extra fields: fuel consumption if supported in region, else
        // duration/distance
        // FieldMask is critical for v2 API
        requestBody.put("routeModifiers", Map.of(
                "avoidTolls", false,
                "avoidHighways", false,
                "avoidFerries", false));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Goog-Api-Key", apiKey);
        headers.set("X-Goog-FieldMask",
                "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.description,routes.routeLabels");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(ROUTES_API_URL, HttpMethod.POST, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("routes")) {
                List<Map<String, Object>> routes = (List<Map<String, Object>>) responseBody.get("routes");
                if (!routes.isEmpty()) {
                    return routes.get(0); // Return the best route
                }
            }
            throw new RuntimeException("No routes found");
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch route from Google Maps AI: " + e.getMessage());
        }
    }
}
