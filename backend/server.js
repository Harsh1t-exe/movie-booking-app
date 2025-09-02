const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL?.split(',') || ['https://your-frontend-domain.com']
    : ['http://localhost:3000'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Fallback to individual config if DATABASE_URL not available
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Routes

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movies WHERE is_active = true');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get showtimes for a movie
app.get('/api/movies/:movieId/showtimes', async (req, res) => {
  try {
    const { movieId } = req.params;
    const result = await pool.query(`
      SELECT s.*, t.name as theatre_name, t.location,
        CASE 
          WHEN (s.show_date + s.show_time) <= (NOW() + INTERVAL '5 minutes') THEN 'unavailable'
          WHEN (s.show_date + s.show_time) <= NOW() THEN 'completed'
          ELSE 'available'
        END as booking_status
      FROM showtimes s 
      JOIN theatres t ON s.theatre_id = t.id 
      WHERE s.movie_id = $1 
      ORDER BY s.show_date, s.show_time
    `, [movieId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get showtime details by ID
app.get('/api/showtimes/:showtimeId', async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const result = await pool.query(`
      SELECT s.*, m.title as movie_title, t.name as theatre_name, t.location as theatre_location
      FROM showtimes s 
      JOIN movies m ON s.movie_id = m.id 
      JOIN theatres t ON s.theatre_id = t.id 
      WHERE s.id = $1
    `, [showtimeId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Showtime not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get seats for a showtime
app.get('/api/showtimes/:showtimeId/seats', async (req, res) => {
  try {
    const { showtimeId } = req.params;
    
    // Clean up expired holds first
    await pool.query(`
      UPDATE seats 
      SET held_by_session = NULL, hold_expires_at = NULL 
      WHERE hold_expires_at < NOW() AND is_booked = FALSE
    `);
    
    const result = await pool.query(`
      SELECT *, 
        CASE 
          WHEN is_booked = TRUE THEN 'booked'
          WHEN held_by_session IS NOT NULL AND hold_expires_at > NOW() THEN 'held'
          ELSE 'available'
        END as status
      FROM seats 
      WHERE showtime_id = $1 
      ORDER BY row_number, seat_number
    `, [showtimeId]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hold seats (when user clicks continue)
app.post('/api/seats/hold', async (req, res) => {
  const client = await pool.connect();
  try {
    const { seatIds, sessionId } = req.body;
    
    await client.query('BEGIN');
    
    // Clean up expired holds first
    await client.query(`
      UPDATE seats 
      SET held_by_session = NULL, hold_expires_at = NULL 
      WHERE hold_expires_at < NOW() AND is_booked = FALSE
    `);
    
    // Check if seats are still available
    const checkResult = await client.query(`
      SELECT id FROM seats 
      WHERE id = ANY($1) AND (is_booked = TRUE OR (held_by_session IS NOT NULL AND hold_expires_at > NOW()))
    `, [seatIds]);
    
    if (checkResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Some seats are no longer available' });
    }
    
    // Hold the seats for 5 minutes
    const holdUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    await client.query(`
      UPDATE seats 
      SET held_by_session = $1, hold_expires_at = $2 
      WHERE id = ANY($3)
    `, [sessionId, holdUntil, seatIds]);
    
    await client.query('COMMIT');
    
    res.json({ 
      message: 'Seats held successfully', 
      expiresAt: holdUntil,
      holdDuration: 5 * 60 // 5 minutes in seconds
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Book tickets
app.post('/api/bookings', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { showtimeId, seatIds, customerName, customerEmail, sessionId } = req.body;
    
    // Clean up expired holds first
    await client.query(`
      UPDATE seats 
      SET held_by_session = NULL, hold_expires_at = NULL 
      WHERE hold_expires_at < NOW() AND is_booked = FALSE
    `);
    
    // Check if seats are available and held by this session
    const seatCheck = await client.query(`
      SELECT id FROM seats 
      WHERE id = ANY($1) 
      AND (is_booked = true OR (held_by_session IS NOT NULL AND held_by_session != $2))
    `, [seatIds, sessionId]);
    
    if (seatCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Some seats are no longer available or not held by your session' });
    }
    
    // Create booking
    const bookingResult = await client.query(`
      INSERT INTO bookings (showtime_id, customer_name, customer_email, total_seats)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [showtimeId, customerName, customerEmail, seatIds.length]);
    
    const bookingId = bookingResult.rows[0].id;
    
    // Update seats as booked and clear hold
    await client.query(`
      UPDATE seats 
      SET is_booked = true, booking_id = $1, held_by_session = NULL, hold_expires_at = NULL 
      WHERE id = ANY($2)
    `, [bookingId, seatIds]);
    
    await client.query('COMMIT');
    res.json({ bookingId, message: 'Booking successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Admin Routes

// Add movie
app.post('/api/admin/movies', async (req, res) => {
  try {
    const { title, description, duration, genre, poster_url } = req.body;
    const result = await pool.query(`
      INSERT INTO movies (title, description, duration, genre, poster_url)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [title, description, duration, genre, poster_url]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add theatre
app.post('/api/admin/theatres', async (req, res) => {
  try {
    const { name, location, total_seats, seats_per_row = 10 } = req.body;
    const result = await pool.query(`
      INSERT INTO theatres (name, location, total_seats, seats_per_row)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [name, location, total_seats, seats_per_row]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add showtime
app.post('/api/admin/showtimes', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { movie_id, theatre_id, show_date, show_time, price } = req.body;
    
    // Create showtime
    const showtimeResult = await client.query(`
      INSERT INTO showtimes (movie_id, theatre_id, show_date, show_time, price)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [movie_id, theatre_id, show_date, show_time, price]);
    
    const showtimeId = showtimeResult.rows[0].id;
    
    // Get theatre capacity and seats per row
    const theatreResult = await client.query('SELECT total_seats, seats_per_row FROM theatres WHERE id = $1', [theatre_id]);
    const { total_seats: totalSeats, seats_per_row: seatsPerRow } = theatreResult.rows[0];
    
    // Create seats for this showtime using theatre's seats_per_row setting
    const seats = [];
    for (let row = 1; row <= Math.ceil(totalSeats / seatsPerRow); row++) {
      const rowLetter = String.fromCharCode(64 + row); // A, B, C, etc.
      for (let seat = 1; seat <= Math.min(seatsPerRow, totalSeats - (row - 1) * seatsPerRow); seat++) {
        seats.push([showtimeId, rowLetter, seat]);
      }
    }
    
    const seatValues = seats.map((_, index) => `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`).join(', ');
    const flatSeats = seats.flat();
    
    await client.query(`
      INSERT INTO seats (showtime_id, row_number, seat_number) VALUES ${seatValues}
    `, flatSeats);
    
    await client.query('COMMIT');
    res.json(showtimeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get all theatres (for admin)
app.get('/api/admin/theatres', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM theatres ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all showtimes (for admin)
app.get('/api/admin/showtimes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, m.title as movie_title, t.name as theatre_name, t.location as theatre_location
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      ORDER BY s.show_date, s.show_time
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete movie (admin)
app.delete('/api/admin/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First delete all seats for the showtimes (both booked and unbooked)
    await pool.query('DELETE FROM seats WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = $1)', [id]);
    // Then delete all bookings for the showtimes
    await pool.query('DELETE FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE movie_id = $1)', [id]);
    // Then delete showtimes
    await pool.query('DELETE FROM showtimes WHERE movie_id = $1', [id]);
    // Finally delete the movie
    const result = await pool.query('DELETE FROM movies WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json({ message: 'Movie deleted successfully', movie: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete theatre (admin)
app.delete('/api/admin/theatres/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First delete all seats for the showtimes (both booked and unbooked)
    await pool.query('DELETE FROM seats WHERE showtime_id IN (SELECT id FROM showtimes WHERE theatre_id = $1)', [id]);
    // Then delete all bookings for the showtimes
    await pool.query('DELETE FROM bookings WHERE showtime_id IN (SELECT id FROM showtimes WHERE theatre_id = $1)', [id]);
    // Then delete showtimes
    await pool.query('DELETE FROM showtimes WHERE theatre_id = $1', [id]);
    // Finally delete the theatre
    const result = await pool.query('DELETE FROM theatres WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Theatre not found' });
    }
    
    res.json({ message: 'Theatre deleted successfully', theatre: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete showtime (admin)
app.delete('/api/admin/showtimes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // First delete all seats for this showtime (both booked and unbooked)
    await pool.query('DELETE FROM seats WHERE showtime_id = $1', [id]);
    // Then delete all bookings for this showtime
    await pool.query('DELETE FROM bookings WHERE showtime_id = $1', [id]);
    // Then delete the showtime
    const result = await pool.query('DELETE FROM showtimes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Showtime not found' });
    }
    
    res.json({ message: 'Showtime deleted successfully', showtime: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings (for admin)
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.id, b.showtime_id, b.customer_name, b.customer_email, 
             b.total_seats, b.created_at,
             m.title as movie_title, t.name as theatre_name,
             s.show_date, s.show_time,
             STRING_AGG(se.row_number || se.seat_number, ', ' ORDER BY se.row_number, se.seat_number) as seat_numbers
      FROM bookings b
      JOIN showtimes s ON b.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      JOIN theatres t ON s.theatre_id = t.id
      LEFT JOIN seats se ON b.id = se.booking_id
      GROUP BY b.id, b.showtime_id, b.customer_name, b.customer_email, 
               b.total_seats, b.created_at, m.title, t.name, s.show_date, s.show_time
      ORDER BY b.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
