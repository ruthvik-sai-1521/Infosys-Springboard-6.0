package com.neurofleetx.config;

import com.neurofleetx.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@SuppressWarnings("unused")
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;
        final String userRole;

        System.out.println("Processing Auth Header: " + authHeader); // DEBUG

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractUsername(jwt);
            userRole = jwtService.extractRole(jwt); // Custom method we added
            System.out.println("Extracted JWT - User: " + userEmail + ", Role: " + userRole); // DEBUG

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Determine authority (Spring Security expects ROLE_ prefix usually, but let's
                // check config)
                // If we didn't use hasRole(), just hasAuthority() matches string exactly.
                // Safest to add consistent authorities.
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + userRole);
                System.out.println("Assigned Authority: " + authority.getAuthority()); // DEBUG

                if (jwtService.isTokenValid(jwt, userEmail)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            Collections.singletonList(authority));
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    System.out.println("Authentication Successful for: " + userEmail); // DEBUG
                } else {
                    System.out.println("Token invalid for user: " + userEmail); // DEBUG
                }
            }
        } catch (Exception e) {
            // Token invalid or expired
            System.out.println("JWT Verification Failed: " + e.getMessage());
            e.printStackTrace(); // DEBUG
        }

        filterChain.doFilter(request, response);
    }
}
