package com.neurofleetx.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TripValidationResult {
    private boolean valid; // Can proceed with trip
    private boolean willBeCritical; // Will enter critical zone (<60%)
    private int currentHealthScore; // Current health
    private int predictedHealthScore; // Health after trip
    private String warningMessage; // User-friendly message
    private String recommendation; // What driver should do
}
