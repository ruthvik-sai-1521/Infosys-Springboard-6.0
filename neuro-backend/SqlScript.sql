CREATE DATABASE IF NOT EXISTS neurofleetx;
USE neurofleetx;

-- ==========================================
-- FORCE CLEANUP (Bypass Foreign Key Checks)
-- ==========================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS vehicle_images;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS Vehicle_vehicleImages; -- Drop potential Hibernate default table

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- RE-CREATE TABLES
-- ==========================================

-- 1. Create Parent Table: users
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    
    -- Driver Profile Fields (Stored as TEXT paths)
    mobile_number VARCHAR(255),
    aadhaar_number VARCHAR(255),
    driving_license TEXT,          
    profile_image TEXT,            
    verification_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED'
);

-- 2. Create Child Table: vehicles
CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(255),
    rc_pdf_url TEXT,               
    insurance_pdf_url TEXT,        
    kms_driven INT,
    next_service_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING_ADMIN_APPROVAL',
    
    driver_id BIGINT,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create Grandchild Table: vehicle_images
CREATE TABLE vehicle_images (
    vehicle_id BIGINT NOT NULL,
    image_url TEXT,           -- Renamed to match likely JPA default or explicit column
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

-- 4. Create Table: bookings
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pickup_loc VARCHAR(255),
    dropoff_loc VARCHAR(255),
    fare DOUBLE,
    status VARCHAR(50), -- PENDING, CONFIRMED, COMPLETED, CANCELLED
    booking_time DATETIME,
    
    customer_id BIGINT,
    driver_id BIGINT,
    vehicle_id BIGINT,
    
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- 5. Create Table: feedbacks
CREATE TABLE feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rating INT,
    comment TEXT,
    
    booking_id BIGINT UNIQUE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

-- Alter tables to add new columns if they don't exist (for existing DBs) or just include in create definitions above. 
-- Since we are dropping tables above, let's update the CREATE definitions directly for cleaner script.

-- REF: Update users table definition
DROP TABLE IF EXISTS feedbacks;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicle_images;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    
    -- Driver Profile Fields
    mobile_number VARCHAR(255),
    aadhaar_number VARCHAR(255),
    driving_license TEXT,          
    profile_image TEXT,            
    verification_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED',
    
    -- New Fields for Ratings
    average_rating DOUBLE DEFAULT 0.0,
    rating_count INT DEFAULT 0
);

CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(255),
    rc_pdf_url TEXT,               
    insurance_pdf_url TEXT,        
    kms_driven INT,
    next_service_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING_ADMIN_APPROVAL',
    
    -- New Fields
    type VARCHAR(50), -- EV, SEDAN, SUV
    seat_count INT,
    storage_capacity VARCHAR(50),
    current_location VARCHAR(255), -- "lat,lng"
    battery_level INT,
    
    driver_id BIGINT,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Re-create images and bookings as defined above...
CREATE TABLE vehicle_images (
    vehicle_id BIGINT NOT NULL,
    image_url TEXT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
);

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pickup_loc VARCHAR(255),
    dropoff_loc VARCHAR(255),
    fare DOUBLE,
    status VARCHAR(50),
    booking_time DATETIME,
    
    customer_id BIGINT,
    driver_id BIGINT,
    vehicle_id BIGINT,
    
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rating INT,
    comment TEXT,
    
    booking_id BIGINT UNIQUE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);