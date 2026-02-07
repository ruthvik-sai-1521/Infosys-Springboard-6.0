-- ==========================================================
-- Safe Health Monitoring Migration Script
-- This script safely adds columns ONLY if they do not exist
-- ==========================================================

USE neurofleetx;

DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

DELIMITER //

CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(255),
    IN colName VARCHAR(255),
    IN colDef VARCHAR(255)
)
BEGIN
    DECLARE colCount INT;
    
    SELECT COUNT(*) INTO colCount 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE() 
    AND table_name = tableName 
    AND column_name = colName;
    
    IF colCount = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', colName, ' ', colDef);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- ==========================================
-- Add Columns (Safe Execution)
-- ==========================================

CALL AddColumnIfNotExists('vehicles', 'engine_health', 'INT DEFAULT 100');
CALL AddColumnIfNotExists('vehicles', 'transmission_health', 'INT DEFAULT 100');
CALL AddColumnIfNotExists('vehicles', 'brake_pad_health', 'INT DEFAULT 100');

CALL AddColumnIfNotExists('vehicles', 'tire_health', 'INT DEFAULT 100');
CALL AddColumnIfNotExists('vehicles', 'tire_pressure_fl', 'DOUBLE DEFAULT 32.0');
CALL AddColumnIfNotExists('vehicles', 'tire_pressure_fr', 'DOUBLE DEFAULT 32.0');
CALL AddColumnIfNotExists('vehicles', 'tire_pressure_rl', 'DOUBLE DEFAULT 32.0');
CALL AddColumnIfNotExists('vehicles', 'tire_pressure_rr', 'DOUBLE DEFAULT 32.0');

CALL AddColumnIfNotExists('vehicles', 'battery_health', 'INT DEFAULT 100');
CALL AddColumnIfNotExists('vehicles', 'battery_voltage', 'DOUBLE DEFAULT 12.6');

CALL AddColumnIfNotExists('vehicles', 'oil_level', 'INT DEFAULT 100');
CALL AddColumnIfNotExists('vehicles', 'coolant_level', 'INT DEFAULT 100');

CALL AddColumnIfNotExists('vehicles', 'kms_since_last_service', 'INT DEFAULT 0');
CALL AddColumnIfNotExists('vehicles', 'last_service_date', 'DATETIME');
CALL AddColumnIfNotExists('vehicles', 'last_health_check', 'DATETIME');

CALL AddColumnIfNotExists('vehicles', 'health_status', "VARCHAR(50) DEFAULT 'HEALTHY'");
CALL AddColumnIfNotExists('vehicles', 'health_score', 'INT DEFAULT 100');

-- Clean up
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- ==========================================
-- End of Script
-- ==========================================
