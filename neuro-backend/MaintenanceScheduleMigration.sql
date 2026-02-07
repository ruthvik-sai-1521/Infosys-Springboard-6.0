-- ==========================================================
-- Maintenance Schedules Migration Script
-- Creates maintenance_schedules table for tracking planned services
-- ==========================================================

USE neurofleetx;

CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    vehicle_id BIGINT NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL, -- Enum: OIL_CHANGE, TIRE_ROTATION, etc.
    priority VARCHAR(20) DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    status VARCHAR(20) DEFAULT 'SCHEDULED', -- PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE
    
    scheduled_date DATE,
    completed_date DATETIME,
    
    estimated_cost DOUBLE,
    actual_cost DOUBLE,
    
    notes TEXT,
    service_provider VARCHAR(255),
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    
    INDEX idx_vehicle_status (vehicle_id, status),
    INDEX idx_scheduled_date (scheduled_date)
);
