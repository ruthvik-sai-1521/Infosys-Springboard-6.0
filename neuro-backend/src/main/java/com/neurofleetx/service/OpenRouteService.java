package com.neurofleetx.service;

import com.neurofleetx.dto.LatLng;
import com.neurofleetx.dto.RouteOption;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OpenRouteService {

    private static final Logger logger = LoggerFactory.getLogger(OpenRouteService.class);

    @Autowired
    private RestTemplate restTemplate;

    @Value("${openrouteservice.api.key}")
    private String apiKey;

    @Value("${openrouteservice.api.url}")
    private String directionsUrl;

    // We will use Nominatim for geocoding as requested
    private final String NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
    private final String NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

    /**
     * Fetch multiple route options from OpenRouteService
     */
    @SuppressWarnings("rawtypes")
    public List<RouteOption> getDirections(String origin, String destination, boolean computeAlternatives) {
        try {
            // ORS requires coordinates (lon,lat)
            LatLng startCoords = getCoordinates(origin);
            LatLng endCoords = getCoordinates(destination);

            logger.info("DEBUG: Route Calc - Start: {},{} ({})", startCoords.getLatitude(), startCoords.getLongitude(),
                    origin);
            logger.info("DEBUG: Route Calc - End: {},{} ({})", endCoords.getLatitude(), endCoords.getLongitude(),
                    destination);

            // Construct ORS v2 JSON Body
            Map<String, Object> requestBody = new HashMap<>();

            List<List<Double>> coordinates = new ArrayList<>();
            coordinates.add(List.of(startCoords.getLongitude(), startCoords.getLatitude()));
            coordinates.add(List.of(endCoords.getLongitude(), endCoords.getLatitude()));
            requestBody.put("coordinates", coordinates);

            // Increase snapping radius to avoid "Could not find routable point" errors
            List<Integer> radiuses = new ArrayList<>();
            radiuses.add(5000);
            radiuses.add(5000);
            requestBody.put("radiuses", radiuses);

            if (computeAlternatives) {
                Map<String, Object> alternatives = new HashMap<>();
                alternatives.put("target_count", 2);
                alternatives.put("weight_factor", 1.4);
                alternatives.put("share_factor", 0.6);
                requestBody.put("alternative_routes", alternatives);
            }

            String postUrl = directionsUrl;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", apiKey);
            headers.set("Content-Type", "application/json");

            org.springframework.http.HttpEntity<Map<String, Object>> entity = new org.springframework.http.HttpEntity<>(
                    requestBody, headers);

            logger.info("DEBUG: Calling ORS API (POST): {}", postUrl);

            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(postUrl, entity, Map.class);
                logger.info("DEBUG: ORS Response Status: {}", response.getStatusCode());
                Map responseBody = response.getBody();

                if (responseBody != null) {
                    logger.info("DEBUG: ORS Response Body Keys: {}", responseBody.keySet());

                    if (responseBody.containsKey("features")) {
                        List<Map<String, Object>> features = (List<Map<String, Object>>) responseBody.get("features");
                        logger.info("DEBUG: Found {} features via ORS.", features.size());
                        return parseORSRoutes(features, origin, destination);
                    } else if (responseBody.containsKey("routes")) {
                        List<Map<String, Object>> routes = (List<Map<String, Object>>) responseBody.get("routes");
                        logger.info("DEBUG: Found {} routes via ORS.", routes.size());
                        return parseRoutesList(routes, origin, destination);
                    } else {
                        logger.error("DEBUG: Response body does NOT contain 'features' or 'routes'");
                        logger.error("DEBUG: Full Body: {}", responseBody);
                    }
                } else {
                    logger.error("DEBUG: Response body is null");
                }
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                String responseBody = e.getResponseBodyAsString();
                if (computeAlternatives && responseBody != null &&
                        (responseBody.contains("150000") || responseBody.contains("100000"))) {
                    logger.warn("DEBUG: Route exceeded distance limit for alternatives. Retrying with single route...");
                    return getDirections(origin, destination, false);
                }
                throw e;
            }

            throw new RuntimeException("No routes found");

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            String errorMessage = "Failed to fetch directions";

            if (responseBody != null && responseBody.contains("\"message\":\"")) {
                int start = responseBody.indexOf("\"message\":\"") + 11;
                int end = responseBody.indexOf("\"", start);
                if (end > start) {
                    errorMessage = responseBody.substring(start, end);
                }
            }

            if (computeAlternatives && errorMessage.contains("100000")) {
                logger.warn("DEBUG: Catching top-level 400 for distance limit. Retrying w/o alternatives.");
                return getDirections(origin, destination, false);
            }

            logger.error("ORS API Error: {}", errorMessage);
            if (errorMessage.contains("6000000")) {
                throw new RuntimeException("Route too long (>6000km). Please check if your addresses are correct.");
            }
            throw new RuntimeException("ORS Error: " + errorMessage);
        } catch (Exception e) {
            logger.error("ORS Directions API failed: {}", e.getMessage());
            throw new RuntimeException("Failed to fetch directions: " + e.getMessage());
        }
    }

    /**
     * Geocode address to coordinates using Nominatim
     */
    @SuppressWarnings("rawtypes")
    public LatLng getCoordinates(String location) {
        // If location is already "lat,lng", parse it
        if (location.matches("-?\\d+(\\.\\d+)?,-?\\d+(\\.\\d+)?")) {
            String[] parts = location.split(",");
            return new LatLng(Double.parseDouble(parts[0].trim()), Double.parseDouble(parts[1].trim()));
        }

        // Standard geocoding with Nominatim
        try {
            String url = NOMINATIM_SEARCH_URL + "?format=json&countrycodes=in&q="
                    + URLEncoder.encode(location, StandardCharsets.UTF_8);

            // Nominatim requires User-Agent
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "NeuroFleetX/1.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>("parameters",
                    headers);

            ResponseEntity<List> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity,
                    List.class);
            List<Map<String, Object>> results = response.getBody();

            if (results != null && !results.isEmpty()) {
                Map<String, Object> firstResult = results.get(0);
                Double lat = Double.parseDouble(firstResult.get("lat").toString());
                Double lon = Double.parseDouble(firstResult.get("lon").toString());
                String displayName = (String) firstResult.get("display_name");

                System.out.println(
                        "DEBUG: Geocoded '" + location + "' to: " + displayName + " (" + lat + ", " + lon + ")");

                return new LatLng(lat, lon);
            }
        } catch (Exception e) {
            System.err.println("Geocoding failed for " + location + ": " + e.getMessage());
        }

        throw new RuntimeException("Could not geocode location: " + location);
    }

    // Alias to match requested function name "geocode"
    public LatLng geocode(String address) {
        return getCoordinates(address);
    }

    private List<RouteOption> parseRoutesList(List<Map<String, Object>> routes, String origin, String destination) {
        List<RouteOption> options = new ArrayList<>();

        for (int i = 0; i < routes.size(); i++) {
            Map<String, Object> route = routes.get(i);
            Map<String, Object> summary = (Map<String, Object>) route.get("summary");

            RouteOption option = new RouteOption();
            option.setId("route_" + i);

            if (summary != null) {
                if (summary.containsKey("distance")) {
                    Double dist = ((Number) summary.get("distance")).doubleValue(); // meters
                    option.setDistanceMeters(dist);
                    option.setDistanceKm(dist / 1000.0);
                    option.setFormattedDistance(String.format("%.2f km", dist / 1000.0));
                }
                if (summary.containsKey("duration")) {
                    Double dur = ((Number) summary.get("duration")).doubleValue(); // seconds
                    option.setDurationSeconds(dur.intValue());
                    option.setDurationMinutes(dur.intValue() / 60);
                    option.setFormattedDuration(formatDuration(dur.intValue()));
                }
            }

            if (route.containsKey("geometry")) {
                Object geom = route.get("geometry");
                if (geom instanceof String) {
                    // It's likely an encoded polyline
                    option.setEncodedPolyline((String) geom);
                } else if (geom instanceof Map) {
                    // GeoJSON format inside routes?
                    Map<String, Object> geomMap = (Map<String, Object>) geom;
                    if ("LineString".equals(geomMap.get("type"))) {
                        List<List<Double>> coords = (List<List<Double>>) geomMap.get("coordinates");
                        option.setEncodedPolyline(encodePolyline(coords));
                    }
                }
            }

            option.setSummary("Route via ORS");
            String summaryText = "";
            if (route.containsKey("segments")) {
                List<Map<String, Object>> segments = (List<Map<String, Object>>) route.get("segments");
                if (segments != null && !segments.isEmpty()) {
                    List<Map<String, Object>> steps = (List<Map<String, Object>>) segments.get(0).get("steps");
                    if (steps != null && !steps.isEmpty()) {
                        // Try to get major road name
                        for (Map<String, Object> step : steps) {
                            if (step.containsKey("name") && !"-".equals(step.get("name"))) {
                                summaryText = (String) step.get("name");
                                break;
                            }
                        }
                    }
                }
            }

            if (summaryText == null || summaryText.isEmpty()) {
                summaryText = "Route via ORS";
            }
            option.setSummary(summaryText);

            option.setRouteLabel(i == 0 ? "BEST_ROUTE" : "ALTERNATIVE_" + i);
            option.setWarnings(new ArrayList<>());

            options.add(option);
        }
        return options;
    }

    private List<RouteOption> parseORSRoutes(List<Map<String, Object>> features, String origin, String destination) {
        List<RouteOption> options = new ArrayList<>();

        for (int i = 0; i < features.size(); i++) {
            Map<String, Object> feature = features.get(i);
            Map<String, Object> properties = (Map<String, Object>) feature.get("properties");
            Map<String, Object> geometry = (Map<String, Object>) feature.get("geometry");

            RouteOption option = new RouteOption();
            option.setId("route_" + i);

            if (properties != null) {
                Map<String, Object> summary = (Map<String, Object>) properties.get("summary");

                if (summary != null) {
                    if (summary.containsKey("distance")) {
                        Double dist = ((Number) summary.get("distance")).doubleValue(); // meters
                        option.setDistanceMeters(dist);
                        option.setDistanceKm(dist / 1000.0);
                        option.setFormattedDistance(String.format("%.2f km", dist / 1000.0));
                    }
                    if (summary.containsKey("duration")) {
                        Double dur = ((Number) summary.get("duration")).doubleValue(); // seconds
                        option.setDurationSeconds(dur.intValue());
                        option.setDurationMinutes(dur.intValue() / 60);
                        option.setFormattedDuration(formatDuration(dur.intValue()));
                    }
                }
            }

            if (geometry != null && "LineString".equals(geometry.get("type"))) {
                List<List<Double>> coords = (List<List<Double>>) geometry.get("coordinates");
                option.setEncodedPolyline(encodePolyline(coords));
            }

            option.setSummary("Route via ORS");
            option.setRouteLabel(i == 0 ? "BEST_ROUTE" : "ALTERNATIVE_" + i);
            option.setWarnings(new ArrayList<>());

            options.add(option);
        }
        return options;
    }

    /**
     * Decode Polyline (Google Algorithm)
     */
    public List<LatLng> decodePolyline(String encoded) {
        List<LatLng> poly = new ArrayList<>();
        int index = 0, len = encoded.length();
        int lat = 0, lng = 0;

        while (index < len) {
            int b, shift = 0, result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;
            do {
                b = encoded.charAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);
            int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            LatLng position = new LatLng((lat / 1E5), (lng / 1E5));
            poly.add(position);
        }
        return poly;
    }

    /**
     * Encode list of coordinates [lon, lat] to Polygon string
     */
    private String encodePolyline(List<List<Double>> points) {
        long lastLat = 0;
        long lastLng = 0;
        StringBuilder result = new StringBuilder();

        for (List<Double> point : points) {
            // ORS returns [lon, lat]
            long lat = Math.round(point.get(1) * 1e5);
            long lng = Math.round(point.get(0) * 1e5);

            long dLat = lat - lastLat;
            long dLng = lng - lastLng;

            encode(dLat, result);
            encode(dLng, result);

            lastLat = lat;
            lastLng = lng;
        }
        return result.toString();
    }

    private void encode(long v, StringBuilder result) {
        v = v < 0 ? ~(v << 1) : v << 1;
        while (v >= 0x20) {
            result.append(Character.toChars((int) ((0x20 | (v & 0x1f)) + 63)));
            v >>= 5;
        }
        result.append(Character.toChars((int) (v + 63)));
    }

    public String reverseGeocode(Double latitude, Double longitude) {
        try {
            // Nominatim Reverse Geocoding
            String url = NOMINATIM_REVERSE_URL + "?format=json&lat=" + latitude + "&lon=" + longitude;

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "NeuroFleetX/1.0");
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>("parameters",
                    headers);

            @SuppressWarnings("rawtypes")
            ResponseEntity<Map> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity,
                    Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && body.containsKey("display_name")) {
                return (String) body.get("display_name");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "Unknown Location";
    }

    public Map<String, Object> calculateETA(Integer durationSeconds) {
        long currentTimeMillis = System.currentTimeMillis();
        long etaMillis = currentTimeMillis + (durationSeconds * 1000L);

        Map<String, Object> eta = new HashMap<>();
        eta.put("etaTimestamp", etaMillis);
        eta.put("etaISO", new java.util.Date(etaMillis).toString());
        eta.put("durationSeconds", durationSeconds);
        eta.put("formattedDuration", formatDuration(durationSeconds));

        return eta;
    }

    private String formatDuration(int seconds) {
        int hours = seconds / 3600;
        int minutes = (seconds % 3600) / 60;
        return hours > 0 ? String.format("%dh %dm", hours, minutes) : String.format("%dm", minutes);
    }
}
