package com.neurofleetx.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig implements org.springframework.web.servlet.config.annotation.WebMvcConfigurer {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Override
    public void addResourceHandlers(
            org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(request -> {
                    var config = new CorsConfiguration();
                    config.setAllowedOrigins(List.of("http://localhost:3000"));
                    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                    config.setAllowedHeaders(List.of("*"));
                    config.setAllowCredentials(true);
                    return config;
                }))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) -> {
                    // Return 401 instead of 403 for missing auth
                    res.setStatus(401);
                    res.getWriter().write("{\"error\": \"Unauthorized: " + e.getMessage() + "\"}");
                }))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**", "/uploads/**").permitAll()
                        // Specific Role Access (Optional but recommended)
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_MANAGER")
                        .requestMatchers("/api/driver/**").hasAnyAuthority("ROLE_DRIVER", "ROLE_ADMIN")
                        .requestMatchers("/api/customer/**").hasAnyAuthority("ROLE_CUSTOMER", "ROLE_ADMIN")
                        .requestMatchers("/api/trips/**").authenticated() // or hasAnyAuthority("ROLE_DRIVER",
                                                                          // "ROLE_CUSTOMER", "ROLE_ADMIN")
                        .requestMatchers("/api/bookings/**").authenticated()
                        .requestMatchers("/api/health/fleet/**").hasAnyAuthority("ROLE_MANAGER", "ROLE_ADMIN")
                        .requestMatchers("/api/health/driver/**")
                        .hasAnyAuthority("ROLE_DRIVER", "ROLE_MANAGER", "ROLE_ADMIN")
                        .requestMatchers("/api/health/alerts/**")
                        .hasAnyAuthority("ROLE_DRIVER", "ROLE_MANAGER", "ROLE_ADMIN")
                        .requestMatchers("/api/health/vehicle/**").authenticated()
                        .anyRequest().authenticated())

                .sessionManagement(sess -> sess.sessionCreationPolicy(
                        org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthFilter,
                        org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}