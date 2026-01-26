package com.neurofleetx.config;

import com.neurofleetx.model.User;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if admin exists
        if (userRepository.findByEmail("fleetxadmin@gmail.com").isEmpty()) {
            User admin = new User();
            admin.setUsername("AdminFleetX");
            admin.setEmail("fleetxadmin@gmail.com");
            admin.setPassword(passwordEncoder.encode("admin@1234"));
            admin.setRole("ADMIN");
            admin.setVerificationStatus("APPROVED");

            userRepository.save(admin);
            System.out.println("DEFAULT ADMIN CREATED: fleetxadmin@gmail.com / admin@1234");
        }
    }
}
