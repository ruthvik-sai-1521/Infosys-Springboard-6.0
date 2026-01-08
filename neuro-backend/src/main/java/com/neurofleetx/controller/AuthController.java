package com.neurofleetx.controller;

import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; // Injected BCrypt bean

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "Email already registered."));
        }
        
        // HASH the password before saving 
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("message", "Registration successful with BCrypt security!"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String rawPassword = request.get("password");
        String requestedRole = request.get("role");

        return userRepository.findByEmail(email)
            .map(user -> {
                // Use passwordEncoder.matches to compare raw password with the hash
                if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid access key."));
                }
                
                if (!user.getRole().equals(requestedRole)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Access denied for the " + requestedRole + " workspace."));
                }
                
                return ResponseEntity.ok(Map.of(
                    "role", user.getRole(), 
                    "username", user.getUsername()
                ));
            })
            .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Account not found.")));
    }
}