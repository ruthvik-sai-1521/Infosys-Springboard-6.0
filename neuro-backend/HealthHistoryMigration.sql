-- ==========================================================
-- Health History Migration Script
-- Creates vehicle_health_history table for trend analysis
-- ==========================================================

USE neurofleetx;

CREATE TABLE IF NOT EXISTS vehicle_health_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    trip_id BIGINT,
    recorded_at DATETIME NOT NULL,
    
    -- Metrics Snapshot
    engine_health INT,
    transmission_health INT,
    brake_pad_health INT,
    tire_health INT,
    battery_health INT,
    oil_level INT,
    coolant_level INT,
    
    -- Context
    total_kms_driven INT, -- Snapshot of vehicle's odometer
    health_score INT,
    health_status VARCHAR(50),
    
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    
    INDEX idx_vehicle_date (vehicle_id, recorded_at)
);
