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
