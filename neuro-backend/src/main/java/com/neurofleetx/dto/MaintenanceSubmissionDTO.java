package com.neurofleetx.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
public class MaintenanceSubmissionDTO {
    private Long vehicleId;
    private LocalDate maintenanceDate;
    private String description;
    // Image URLs will be handled separately via MultipartFile uploads
}
