-- Movie Booking App Database Schema

-- Create database (run this separately)
-- CREATE DATABASE moviebooking;

-- Connect to the database and run the following:

-- Movies table
CREATE TABLE movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL, -- in minutes
    genre VARCHAR(100),
    poster_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Theatres table
CREATE TABLE theatres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Showtimes table
CREATE TABLE showtimes (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id),
    theatre_id INTEGER REFERENCES theatres(id),
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    showtime_id INTEGER REFERENCES showtimes(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seats table
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    showtime_id INTEGER REFERENCES showtimes(id),
    row_number VARCHAR(5) NOT NULL,
    seat_number INTEGER NOT NULL,
    is_booked BOOLEAN DEFAULT false,
    booking_id INTEGER REFERENCES bookings(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data

-- Sample movies
INSERT INTO movies (title, description, duration, genre, poster_url) VALUES
('The Amazing Spider-Man', 'A superhero movie about Peter Parker', 142, 'Action', 'https://via.placeholder.com/300x450'),
('Inception', 'A mind-bending thriller about dreams', 148, 'Sci-Fi', 'https://via.placeholder.com/300x450'),
('The Dark Knight', 'Batman fights the Joker in Gotham City', 152, 'Action', 'https://via.placeholder.com/300x450');

-- Sample theatres
INSERT INTO theatres (name, location, total_seats) VALUES
('PVR Cinemas', 'Mall Road', 100),
('INOX Theatre', 'City Center', 80),
('Big Cinemas', 'Downtown', 120);

-- Sample showtimes (adjust dates as needed)
INSERT INTO showtimes (movie_id, theatre_id, show_date, show_time, price) VALUES
(1, 1, '2025-09-03', '10:00:00', 250.00),
(1, 1, '2025-09-03', '13:30:00', 300.00),
(1, 1, '2025-09-03', '17:00:00', 350.00),
(1, 2, '2025-09-03', '11:00:00', 280.00),
(2, 1, '2025-09-03', '14:00:00', 320.00),
(2, 2, '2025-09-03', '18:30:00', 380.00),
(3, 3, '2025-09-03', '15:00:00', 300.00);

-- Create indexes for better performance
CREATE INDEX idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX idx_showtimes_theatre_id ON showtimes(theatre_id);
CREATE INDEX idx_seats_showtime_id ON seats(showtime_id);
CREATE INDEX idx_bookings_showtime_id ON bookings(showtime_id);
