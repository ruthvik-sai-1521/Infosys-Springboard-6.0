-- ==========================================================
-- Maintenance Alerts Migration Script
-- Creates maintenance_alerts table for tracking vehicle issues
-- ==========================================================

USE neurofleetx;

CREATE TABLE IF NOT EXISTS maintenance_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relationships
    vehicle_id BIGINT NOT NULL,
    driver_id BIGINT, -- Assigned driver at time of alert
    
    -- Alert Classification
    alert_type VARCHAR(50) NOT NULL, -- PREDICTIVE, THRESHOLD, SCHEDULED, EMERGENCY
    component VARCHAR(50) NOT NULL,  -- ENGINE, TIRES, BATTERY, BRAKES, OIL, COOLANT, TRANSMISSION, OTHER
    severity VARCHAR(20) NOT NULL,   -- LOW, MEDIUM, HIGH, CRITICAL
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, DISMISSED
    
    -- Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommended_action TEXT,
    
    -- Technical Data
    current_value VARCHAR(50), -- e.g., "15 PSI" or "85%"
    threshold_value VARCHAR(50), -- e.g., "30 PSI" or "< 20%"
    
    -- Lifecycle Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME,
    resolved_at DATETIME,
    
    -- Workflow Users
    acknowledged_by BIGINT,
    resolved_by BIGINT,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id),
    
    -- Indexes for efficient filtering
    INDEX idx_vehicle_status (vehicle_id, status),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at)
);
