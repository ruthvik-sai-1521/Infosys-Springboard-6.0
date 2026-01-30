-- Add ratings to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating DOUBLE DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'NOT_SUBMITTED';

-- Add new columns to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seat_count INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS storage_capacity DOUBLE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_location VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_level INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_level INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mileage DOUBLE;

-- NEW COLUMNS FOR VEHICLE REGISTRATION
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rc_document TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_document TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS kilometers_driven DOUBLE;

-- Create Bookings Table if not exists
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pickup_location VARCHAR(255),
    drop_location VARCHAR(255),
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

-- Create Feedbacks Table
CREATE TABLE IF NOT EXISTS feedbacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rating INT,
    comment TEXT,
    booking_id BIGINT UNIQUE,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Manual Trip Logs (Optional if using Bookings table, but good explicit table)
CREATE TABLE IF NOT EXISTS trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(255),
    destination VARCHAR(255),
    distance DOUBLE,
    trip_date DATETIME,
    fare DOUBLE,
    driver_id BIGINT,
    vehicle_id BIGINT,
    FOREIGN KEY (driver_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    content TEXT,
    sent_at DATETIME,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add is_read column if messages table already exists (for existing databases)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add trip lifecycle tracking fields
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_start_time DATETIME;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_end_time DATETIME;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS estimated_duration INT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS auto_end_time DATETIME;

-- Add driver statistics fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings DOUBLE DEFAULT 0.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_earnings DOUBLE DEFAULT 0.0;

-- Create admin_requests table for Manager to Admin communication
CREATE TABLE IF NOT EXISTS admin_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    sender_role VARCHAR(50) DEFAULT 'MANAGER',
    receiver_id BIGINT,
    receiver_role VARCHAR(50) DEFAULT 'ADMIN',
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS completed_trips_count INT DEFAULT 0;

-- Update existing vehicles with correct seat counts based on type
UPDATE vehicles SET seat_count = 5 WHERE UPPER(type) = 'SUV' AND (seat_count IS NULL OR seat_count != 5);
UPDATE vehicles SET seat_count = 3 WHERE UPPER(type) IN ('SEDAN', 'HATCHBACK', 'EV') AND (seat_count IS NULL OR seat_count != 3);

-- Set default seat count for vehicles without a type
UPDATE vehicles SET seat_count = 3 WHERE seat_count IS NULL;
