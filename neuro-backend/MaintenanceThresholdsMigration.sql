-- ==========================================================
-- Maintenance Thresholds Migration Script
-- Creates maintenance_thresholds table for configurable alerts
-- ==========================================================

USE neurofleetx;

CREATE TABLE IF NOT EXISTS maintenance_thresholds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    component_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'ENGINE_HEALTH', 'TIRE_PRESSURE_FL'
    warning_threshold DOUBLE,  -- Value triggering a WARNING alert
    critical_threshold DOUBLE, -- Value triggering a CRITICAL alert
    unit VARCHAR(20),          -- %, PSI, V, km
    check_type VARCHAR(10) DEFAULT 'BELOW', -- 'BELOW' (alert if < threshold) or 'ABOVE' (alert if > threshold)
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active)
);

-- ==========================================
-- Insert Default Thresholds
-- ==========================================

-- Engine Health (Critical < 50%, Warning < 70%)
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('ENGINE_HEALTH', 70.0, 50.0, '%', 'BELOW', 'Engine health percentage');

-- Tire Health (Critical < 20%, Warning < 40%)
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('TIRE_HEALTH', 40.0, 20.0, '%', 'BELOW', 'Overall tire tread/health percentage');

-- Tire Pressure (Critical < 24 PSI, Warning < 28 PSI)
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('TIRE_PRESSURE', 28.0, 24.0, 'PSI', 'BELOW', 'Tire pressure for all tires');

-- Battery Health (Critical < 40%, Warning < 60%)
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('BATTERY_HEALTH', 60.0, 40.0, '%', 'BELOW', 'Battery charge/health percentage');

-- Oil Level (Critical < 15%, Warning < 30%)
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('OIL_LEVEL', 30.0, 15.0, '%', 'BELOW', 'Engine oil level percentage');

-- Transmission Health (Critical < 40%, Warning < 60%) - Added based on Vehicle model
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('TRANSMISSION_HEALTH', 60.0, 40.0, '%', 'BELOW', 'Transmission system health');

-- Brake Health (Critical < 30%, Warning < 50%)
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('BRAKE_PAD_HEALTH', 50.0, 30.0, '%', 'BELOW', 'Brake pad wear percentage');

-- Service Interval (Critical > 10000km, Warning > 8000km)
-- Note: Check type is ABOVE because exceeding the limit is bad
INSERT INTO maintenance_thresholds (component_name, warning_threshold, critical_threshold, unit, check_type, description)
VALUES ('KMS_SINCE_SERVICE', 8000.0, 10000.0, 'km', 'ABOVE', 'Kilometers driven since last service');

