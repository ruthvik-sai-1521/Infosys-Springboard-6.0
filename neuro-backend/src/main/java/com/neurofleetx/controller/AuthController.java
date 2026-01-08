package com.neurofleetx.controller;

import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
// Ensure CORS matches your React URL exactly
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "User already exists. Please login."));
        }
        
        // Ensure role is saved (sent from React)
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("message", "Registration successful! Proceed to login."));
    }

    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
    String email = request.get("email");
    String password = request.get("password");
    String requestedRole = request.get("role"); // Extract the role from the dropdown

    return userRepository.findByEmail(email)
        .map(user -> {
            // 1. Check Password
            if (!user.getPassword().equals(password)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid access key."));
            }
            // 2. Verify Role (prevents a Driver from logging into the Admin panel)
            if (!user.getRole().equals(requestedRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Access denied: Account is not authorized for the " + requestedRole + " workspace."));
            }
            
            return ResponseEntity.ok(Map.of(
                "role", user.getRole(), 
                "username", user.getUsername()
            ));
        })
        .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("message", "Account not found. Please register.")));
}
}