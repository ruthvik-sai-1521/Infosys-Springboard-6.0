package com.neurofleetx.model;

public enum HealthStatus {
    HEALTHY("Healthy", "#10B981"), // Emerald-500
    GOOD("Good", "#34D399"), // Emerald-400
    WARNING("Warning", "#F59E0B"), // Amber-500
    DUE("Due", "#F97316"), // Orange-500
    CRITICAL("Critical", "#EF4444"); // Red-500

    private final String displayName;
    private final String colorCode;

    HealthStatus(String displayName, String colorCode) {
        this.displayName = displayName;
        this.colorCode = colorCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getColorCode() {
        return colorCode;
    }
}
