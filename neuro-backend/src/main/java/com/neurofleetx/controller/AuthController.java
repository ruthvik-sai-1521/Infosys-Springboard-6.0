package com.neurofleetx.controller;

import com.neurofleetx.dto.LoginRequest;
import com.neurofleetx.dto.RegisterRequest;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        // 1. Check for Pre-defined Admin Credentials
        if ("fleetxadmin@gmail.com".equals(loginRequest.getEmail()) &&
                "admin@1234".equals(loginRequest.getPassword()) &&
                "ADMIN".equals(loginRequest.getRole())) {

            String token = jwtService.generateToken(loginRequest.getEmail(), "ADMIN");
            return ResponseEntity.ok(Map.of("token", token, "username", "System Admin", "role", "ADMIN", "id", 1L));
        }

        // 2. Database check for other roles
        return userRepository.findByEmail(loginRequest.getEmail())
                .map(user -> {
                    // Password Match Check
                    if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(Map.of("message", "Invalid Access Key."));
                    }

                    // Specific Role Mismatch Check
                    if (!user.getRole().equalsIgnoreCase(loginRequest.getRole())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("message", "Invalid Role: Registered as " + user.getRole() +
                                        ", but trying to login as " + loginRequest.getRole() + "."));
                    }

                    String token = jwtService.generateToken(user.getEmail(), user.getRole());
                    return ResponseEntity
                            .ok(Map.of("token", token, "username", user.getUsername(), "role", user.getRole(), "id",
                                    user.getId()));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Account not found for this email.")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is already in use!"));
        }

        com.neurofleetx.model.User newUser = new com.neurofleetx.model.User();
        newUser.setUsername(registerRequest.getName());
        newUser.setEmail(registerRequest.getEmail());
        newUser.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        newUser.setRole(registerRequest.getRole().toUpperCase());

        if ("DRIVER".equalsIgnoreCase(registerRequest.getRole())) {
            newUser.setVerificationStatus("PENDING_VERIFICATION");
        } else {
            newUser.setVerificationStatus("APPROVED");
        }

        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("message", "User registered successfully!"));
    }
}