const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

const setupDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up Movie Booking Database...');
    
    // Check if database exists, if not create it
    const dbCheck = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = 'moviebooking'
    `);
    
    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating moviebooking database...');
      await client.query('CREATE DATABASE moviebooking');
      console.log('✅ Database created successfully!');
    } else {
      console.log('📦 Database moviebooking already exists');
    }
    
    client.release();
    
    // Now connect to the moviebooking database
    const movieDbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'moviebooking',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
    
    const movieClient = await movieDbPool.connect();
    
    console.log('🏗️  Creating tables...');
    
    // Create tables
    await movieClient.query(`
      -- Movies table
      CREATE TABLE IF NOT EXISTS movies (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL,
          genre VARCHAR(100),
          poster_url VARCHAR(500),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await movieClient.query(`
      -- Theatres table
      CREATE TABLE IF NOT EXISTS theatres (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255) NOT NULL,
          total_seats INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await movieClient.query(`
      -- Showtimes table
      CREATE TABLE IF NOT EXISTS showtimes (
          id SERIAL PRIMARY KEY,
          movie_id INTEGER REFERENCES movies(id),
          theatre_id INTEGER REFERENCES theatres(id),
          show_date DATE NOT NULL,
          show_time TIME NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await movieClient.query(`
      -- Bookings table
      CREATE TABLE IF NOT EXISTS bookings (
          id SERIAL PRIMARY KEY,
          showtime_id INTEGER REFERENCES showtimes(id),
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          total_seats INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await movieClient.query(`
      -- Seats table
      CREATE TABLE IF NOT EXISTS seats (
          id SERIAL PRIMARY KEY,
          showtime_id INTEGER REFERENCES showtimes(id),
          row_number VARCHAR(5) NOT NULL,
          seat_number INTEGER NOT NULL,
          is_booked BOOLEAN DEFAULT false,
          booking_id INTEGER REFERENCES bookings(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Tables created successfully!');
    
    // Check if data already exists
    const movieCount = await movieClient.query('SELECT COUNT(*) FROM movies');
    
    if (parseInt(movieCount.rows[0].count) === 0) {
      console.log('📽️  Inserting sample movies...');
      
      // Insert sample movies
      await movieClient.query(`
        INSERT INTO movies (title, description, duration, genre, poster_url) VALUES
        ('The Amazing Spider-Man', 'A superhero movie about Peter Parker discovering his powers', 142, 'Action', 'https://via.placeholder.com/300x450/FF6B6B/FFFFFF?text=Spider-Man'),
        ('Inception', 'A mind-bending thriller about dreams within dreams', 148, 'Sci-Fi', 'https://via.placeholder.com/300x450/4ECDC4/FFFFFF?text=Inception'),
        ('The Dark Knight', 'Batman faces his greatest challenge against the Joker', 152, 'Action', 'https://via.placeholder.com/300x450/45B7D1/FFFFFF?text=Dark+Knight'),
        ('Avengers: Endgame', 'The epic conclusion to the Infinity Saga', 181, 'Action', 'https://via.placeholder.com/300x450/96CEB4/FFFFFF?text=Avengers'),
        ('Interstellar', 'A journey through space and time to save humanity', 169, 'Sci-Fi', 'https://via.placeholder.com/300x450/FECA57/FFFFFF?text=Interstellar');
      `);
      
      console.log('🏛️  Inserting sample theatres...');
      
      // Insert sample theatres
      await movieClient.query(`
        INSERT INTO theatres (name, location, total_seats) VALUES
        ('PVR Cinemas', 'Mall Road, Downtown', 100),
        ('INOX Theatre', 'City Center Plaza', 80),
        ('Big Cinemas', 'Metro Mall', 120),
        ('Cineplex Gold', 'Business District', 150);
      `);
      
      console.log('🎬 Creating sample showtimes...');
      
      // Get today's date and next few days
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      
      const formatDate = (date) => date.toISOString().split('T')[0];
      
      // Insert sample showtimes
      await movieClient.query(`
        INSERT INTO showtimes (movie_id, theatre_id, show_date, show_time, price) VALUES
        -- Today's shows
        (1, 1, '${formatDate(today)}', '10:00:00', 250.00),
        (1, 1, '${formatDate(today)}', '13:30:00', 300.00),
        (1, 1, '${formatDate(today)}', '17:00:00', 350.00),
        (1, 2, '${formatDate(today)}', '11:00:00', 280.00),
        (1, 3, '${formatDate(today)}', '15:30:00', 320.00),
        
        (2, 1, '${formatDate(today)}', '14:00:00', 320.00),
        (2, 2, '${formatDate(today)}', '18:30:00', 380.00),
        (2, 4, '${formatDate(today)}', '21:00:00', 400.00),
        
        (3, 3, '${formatDate(today)}', '12:00:00', 300.00),
        (3, 4, '${formatDate(today)}', '19:30:00', 420.00),
        
        -- Tomorrow's shows
        (1, 1, '${formatDate(tomorrow)}', '10:00:00', 250.00),
        (1, 2, '${formatDate(tomorrow)}', '13:30:00', 300.00),
        (2, 3, '${formatDate(tomorrow)}', '16:00:00', 350.00),
        (3, 4, '${formatDate(tomorrow)}', '20:00:00', 400.00),
        (4, 1, '${formatDate(tomorrow)}', '11:30:00', 380.00),
        (5, 2, '${formatDate(tomorrow)}', '18:00:00', 420.00),
        
        -- Day after tomorrow
        (4, 3, '${formatDate(dayAfter)}', '14:30:00', 380.00),
        (5, 4, '${formatDate(dayAfter)}', '21:30:00', 450.00);
      `);
      
      console.log('🪑 Creating seats for all showtimes...');
      
      // Get all showtimes to create seats
      const showtimes = await movieClient.query(`
        SELECT s.id as showtime_id, t.total_seats 
        FROM showtimes s 
        JOIN theatres t ON s.theatre_id = t.id
      `);
      
      // Create seats for each showtime
      for (const showtime of showtimes.rows) {
        const totalSeats = showtime.total_seats;
        const seatsPerRow = 10;
        const rows = Math.ceil(totalSeats / seatsPerRow);
        
        const seatInserts = [];
        for (let row = 1; row <= rows; row++) {
          const seatsInThisRow = Math.min(seatsPerRow, totalSeats - (row - 1) * seatsPerRow);
          for (let seat = 1; seat <= seatsInThisRow; seat++) {
            seatInserts.push(`(${showtime.showtime_id}, '${String.fromCharCode(64 + row)}', ${seat})`);
          }
        }
        
        if (seatInserts.length > 0) {
          await movieClient.query(`
            INSERT INTO seats (showtime_id, row_number, seat_number) 
            VALUES ${seatInserts.join(', ')}
          `);
        }
      }
      
      console.log('📊 Creating database indexes...');
      
      // Create indexes for better performance
      await movieClient.query(`
        CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON showtimes(movie_id);
        CREATE INDEX IF NOT EXISTS idx_showtimes_theatre_id ON showtimes(theatre_id);
        CREATE INDEX IF NOT EXISTS idx_seats_showtime_id ON seats(showtime_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_showtime_id ON bookings(showtime_id);
      `);
      
      console.log('✅ Sample data inserted successfully!');
    } else {
      console.log('📊 Sample data already exists, skipping insertion');
    }
    
    // Test the setup
    const movieTest = await movieClient.query('SELECT COUNT(*) as movie_count FROM movies');
    const theatreTest = await movieClient.query('SELECT COUNT(*) as theatre_count FROM theatres');
    const showtimeTest = await movieClient.query('SELECT COUNT(*) as showtime_count FROM showtimes');
    const seatTest = await movieClient.query('SELECT COUNT(*) as seat_count FROM seats');
    
    console.log('\n🎉 Database Setup Complete!');
    console.log('=================================');
    console.log(`📽️  Movies: ${movieTest.rows[0].movie_count}`);
    console.log(`🏛️  Theatres: ${theatreTest.rows[0].theatre_count}`);
    console.log(`🎬 Showtimes: ${showtimeTest.rows[0].showtime_count}`);
    console.log(`🪑 Seats: ${seatTest.rows[0].seat_count}`);
    console.log('=================================');
    console.log('\n🚀 You can now start your application!');
    console.log('Run: npm run dev (in backend folder)');
    console.log('And: npm start (in frontend folder)');
    
    movieClient.release();
    await movieDbPool.end();
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    client.release();
  } finally {
    await pool.end();
  }
};

// Run the setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = setupDatabase;
