package com.neurofleetx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration for Live Vehicle Tracking
 * 
 * This enables STOMP protocol over WebSocket for real-time bidirectional
 * communication.
 * Similar to Socket.io but for Spring Boot applications.
 * 
 * Connection: ws://localhost:8080/ws-tracking
 * Subscribe to: /topic/vehicle/{vehicleId}, /topic/trip/{tripId},
 * /topic/manager/vehicles
 * Send to: /app/subscribe, /app/unsubscribe, /app/getLocation
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker for broadcasting
        // Prefix: /topic for pub-sub, /queue for point-to-point
        config.enableSimpleBroker("/topic", "/queue");

        // Prefix for messages from client to server (handled by @MessageMapping)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register WebSocket endpoint that clients connect to
        registry.addEndpoint("/ws-tracking")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:5173") // React dev servers
                .withSockJS(); // Fallback option for browsers that don't support WebSocket

        // Also support native WebSocket (without SockJS)
        registry.addEndpoint("/ws-tracking")
                .setAllowedOrigins("http://localhost:3000", "http://localhost:5173");
    }
}
