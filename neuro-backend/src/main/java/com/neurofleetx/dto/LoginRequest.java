package com.neurofleetx.dto;

import lombok.Data;

/**
 * DTO for capturing login credentials from the frontend.
 * This structure maps directly to the JSON sent by the React application.
 */
@Data
public class LoginRequest {
    private String email;
    private String password;
    private String role;
}