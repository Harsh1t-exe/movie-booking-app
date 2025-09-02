import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, movieAPI } from '../api';

const AdminPanel = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Admin password (in production, this should be in environment variables)
  const ADMIN_PASSWORD = 'admin123';
  
  // Seat view modal state
  const [seatViewModal, setSeatViewModal] = useState({
    isOpen: false,
    showtime: null,
    seats: [],
    loading: false
  });
  
  // Form states
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    duration: '',
    genre: '',
    poster_url: ''
  });
  
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    location: '',
    total_seats: '',
    seats_per_row: '10'
  });
  
  const [showtimeForm, setShowtimeForm] = useState({
    movie_id: '',
    theatre_id: '',
    show_date: '',
    show_time: '',
    price: ''
  });

  useEffect(() => {
    console.log('🚀 AdminPanel mounted, fetching data...');
    fetchData();
  }, []);

  // Debug current state
  useEffect(() => {
    console.log('📊 Current state:', {
      movies: movies.length,
      theatres: theatres.length,
      showtimes: showtimes.length,
      bookings: bookings.length
    });
  }, [movies, theatres, showtimes, bookings]);

  const fetchData = async () => {
    try {
      console.log('🔄 Fetching admin data...');
      
      const [moviesRes, theatresRes, showtimesRes, bookingsRes] = await Promise.all([
        movieAPI.getAllMovies(),
        adminAPI.getTheatres(),
        adminAPI.getShowtimes(),
        adminAPI.getBookings()
      ]);
      
      console.log('✅ API Responses:', {
        movies: moviesRes.data.length,
        theatres: theatresRes.data.length,
        showtimes: showtimesRes.data.length,
        bookings: bookingsRes.data.length
      });
      
      setMovies(moviesRes.data);
      setTheatres(theatresRes.data);
      setShowtimes(showtimesRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addMovie({
        ...movieForm,
        duration: parseInt(movieForm.duration)
      });
      alert('Movie added successfully!');
      setMovieForm({ title: '', description: '', duration: '', genre: '', poster_url: '' });
      fetchData();
    } catch (error) {
      alert('Error adding movie: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddTheatre = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addTheatre({
        ...theatreForm,
        total_seats: parseInt(theatreForm.total_seats),
        seats_per_row: parseInt(theatreForm.seats_per_row)
      });
      alert('Theatre added successfully!');
      setTheatreForm({ name: '', location: '', total_seats: '', seats_per_row: '10' });
      fetchData();
    } catch (error) {
      alert('Error adding theatre: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.addShowtime({
        ...showtimeForm,
        movie_id: parseInt(showtimeForm.movie_id),
        theatre_id: parseInt(showtimeForm.theatre_id),
        price: parseFloat(showtimeForm.price)
      });
      alert('Showtime added successfully!');
      setShowtimeForm({ movie_id: '', theatre_id: '', show_date: '', show_time: '', price: '' });
      fetchData();
    } catch (error) {
      alert('Error adding showtime: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteMovie = async (movieId, movieTitle) => {
    if (window.confirm(`Are you sure you want to delete "${movieTitle}"? This will also delete all related showtimes and bookings.`)) {
      try {
        await adminAPI.deleteMovie(movieId);
        alert('Movie deleted successfully!');
        fetchData();
      } catch (error) {
        alert('Error deleting movie: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDeleteTheatre = async (theatreId, theatreName) => {
    if (window.confirm(`Are you sure you want to delete "${theatreName}"? This will also delete all related showtimes and bookings.`)) {
      try {
        await adminAPI.deleteTheatre(theatreId);
        alert('Theatre deleted successfully!');
        fetchData();
      } catch (error) {
        alert('Error deleting theatre: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleDeleteShowtime = async (showtimeId, movieTitle, theatreName, showDate, showTime) => {
    if (window.confirm(`Are you sure you want to delete the showtime for "${movieTitle}" at ${theatreName} on ${showDate} ${showTime}? This will also delete all related bookings.`)) {
      try {
        await adminAPI.deleteShowtime(showtimeId);
        alert('Showtime deleted successfully!');
        fetchData();
      } catch (error) {
        alert('Error deleting showtime: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  // Seat view functions
  const handleViewSeats = async (showtime) => {
    console.log('🔍 Opening seat view for showtime:', showtime);
    
    setSeatViewModal({
      isOpen: true,
      showtime: showtime,
      seats: [],
      loading: true
    });

    try {
      console.log('📡 Fetching seats for showtime ID:', showtime.id);
      const response = await movieAPI.getSeats(showtime.id);
      console.log('✅ Seats data received:', response.data);
      
      setSeatViewModal(prev => ({
        ...prev,
        seats: response.data,
        loading: false
      }));
    } catch (error) {
      console.error('❌ Error fetching seats:', error);
      setSeatViewModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const closeSeatViewModal = () => {
    setSeatViewModal({
      isOpen: false,
      showtime: null,
      seats: [],
      loading: false
    });
  };

  // Admin login handler
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      setLoginPassword('');
    } else {
      setLoginError('❌ Incorrect password. Please try again.');
      setLoginPassword('');
    }
  };

  // Admin logout handler
  const handleAdminLogout = () => {
    setIsAuthenticated(false);
    setLoginPassword('');
    setLoginError('');
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div>
        <Link to="/">
          <button className="btn back-btn">← Back to Movies</button>
        </Link>

        <div className="admin-login">
          <div className="login-container">
            <h1>🔐 Admin Login</h1>
            <p>Enter admin password to access the admin panel</p>
            
            <form onSubmit={handleAdminLogin} className="login-form">
              <div className="form-group">
                <label>🔑 Admin Password:</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  autoFocus
                />
              </div>
              
              {loginError && (
                <div className="login-error">
                  {loginError}
                </div>
              )}
              
              <button type="submit" className="btn login-btn">
                🚪 Access Admin Panel
              </button>
            </form>
            
            <div className="login-hint">
              <small>💡 Demo Password: <code>admin123</code></small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/">
        <button className="btn back-btn">← Back to Movies</button>
      </Link>

      <div className="admin-panel">
        <div className="admin-header">
          <h1>Admin Panel</h1>
          <button onClick={handleAdminLogout} className="btn logout-btn">
            🚪 Logout
          </button>
        </div>

        {/* Add Movie Section */}
        <div className="admin-section">
          <h2>🎬 Add Movie</h2>
          <form onSubmit={handleAddMovie}>
            <div className="form-row">
              <div className="form-group">
                <label>🎭 Title:</label>
                <input
                  type="text"
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({...movieForm, title: e.target.value})}
                  required
                  placeholder="Enter movie title"
                />
              </div>
              <div className="form-group">
                <label>🎪 Genre:</label>
                <input
                  type="text"
                  value={movieForm.genre}
                  onChange={(e) => setMovieForm({...movieForm, genre: e.target.value})}
                  required
                  placeholder="e.g., Action, Comedy, Drama"
                />
              </div>
              <div className="form-group">
                <label>⏱️ Duration (minutes):</label>
                <input
                  type="number"
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({...movieForm, duration: e.target.value})}
                  required
                  placeholder="e.g., 120"
                />
              </div>
            </div>
            <div className="form-group">
              <label>📝 Description:</label>
              <input
                type="text"
                value={movieForm.description}
                onChange={(e) => setMovieForm({...movieForm, description: e.target.value})}
                placeholder="Brief description of the movie"
              />
            </div>
            <div className="form-group">
              <label>🖼️ Poster URL:</label>
              <input
                type="url"
                value={movieForm.poster_url}
                onChange={(e) => setMovieForm({...movieForm, poster_url: e.target.value})}
                placeholder="https://example.com/poster.jpg"
              />
            </div>
            <button type="submit" className="btn">➕ Add Movie</button>
          </form>
        </div>

        {/* Add Theatre Section */}
        <div className="admin-section">
          <h2>🏛️ Add Theatre</h2>
          <form onSubmit={handleAddTheatre}>
            <div className="form-row">
              <div className="form-group">
                <label>🎭 Theatre Name:</label>
                <input
                  type="text"
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({...theatreForm, name: e.target.value})}
                  required
                  placeholder="e.g., PVR Cinemas"
                />
              </div>
              <div className="form-group">
                <label>📍 Location:</label>
                <input
                  type="text"
                  value={theatreForm.location}
                  onChange={(e) => setTheatreForm({...theatreForm, location: e.target.value})}
                  required
                  placeholder="e.g., Mall Road, Downtown"
                />
              </div>
              <div className="form-group">
                <label>🪑 Total Seats:</label>
                <input
                  type="number"
                  value={theatreForm.total_seats}
                  onChange={(e) => setTheatreForm({...theatreForm, total_seats: e.target.value})}
                  required
                  placeholder="e.g., 100"
                />
              </div>
              <div className="form-group">
                <label>🎬 Seats Per Row:</label>
                <input
                  type="number"
                  value={theatreForm.seats_per_row}
                  onChange={(e) => setTheatreForm({...theatreForm, seats_per_row: e.target.value})}
                  required
                  min="1"
                  max="20"
                  placeholder="e.g., 10"
                />
                <small style={{color: '#666', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block'}}>
                  💡 Number of seats in each row (typical: 8-12 seats)
                </small>
              </div>
            </div>
            <button type="submit" className="btn">➕ Add Theatre</button>
          </form>
        </div>

        {/* Add Showtime Section */}
        <div className="admin-section">
          <h2>🕐 Add Showtime</h2>
          <form onSubmit={handleAddShowtime}>
            <div className="form-row">
              <div className="form-group">
                <label>🎬 Movie:</label>
                <select
                  value={showtimeForm.movie_id}
                  onChange={(e) => setShowtimeForm({...showtimeForm, movie_id: e.target.value})}
                  required
                >
                  <option value="">Select Movie</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>{movie.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>🏛️ Theatre:</label>
                <select
                  value={showtimeForm.theatre_id}
                  onChange={(e) => setShowtimeForm({...showtimeForm, theatre_id: e.target.value})}
                  required
                >
                  <option value="">Select Theatre</option>
                  {theatres.map(theatre => (
                    <option key={theatre.id} value={theatre.id}>{theatre.name} - {theatre.location}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>📅 Date:</label>
                <input
                  type="date"
                  value={showtimeForm.show_date}
                  onChange={(e) => setShowtimeForm({...showtimeForm, show_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>🕐 Time:</label>
                <input
                  type="time"
                  value={showtimeForm.show_time}
                  onChange={(e) => setShowtimeForm({...showtimeForm, show_time: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>💰 Price (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  value={showtimeForm.price}
                  onChange={(e) => setShowtimeForm({...showtimeForm, price: e.target.value})}
                  required
                  placeholder="e.g., 250.00"
                />
              </div>
            </div>
            <button type="submit" className="btn">➕ Add Showtime</button>
          </form>
        </div>

        {/* Movies List Section */}
        <div className="admin-section">
          <h2>🎬 Current Movies</h2>
          {movies.length === 0 ? (
            <p style={{textAlign: 'center', color: '#666', padding: '2rem', fontSize: '1.1rem'}}>
              📭 No movies added yet
            </p>
          ) : (
            <div className="items-grid">
              {movies.map(movie => (
                <div key={movie.id} className="item-card">
                  <div className="item-info">
                    <h3>{movie.title}</h3>
                    <p><strong>Genre:</strong> {movie.genre}</p>
                    <p><strong>Duration:</strong> {movie.duration} minutes</p>
                    <p><strong>Description:</strong> {movie.description}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteMovie(movie.id, movie.title)}
                    className="btn delete-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theatres List Section */}
        <div className="admin-section">
          <h2>🏛️ Current Theatres</h2>
          {theatres.length === 0 ? (
            <p style={{textAlign: 'center', color: '#666', padding: '2rem', fontSize: '1.1rem'}}>
              📭 No theatres added yet
            </p>
          ) : (
            <div className="items-grid">
              {theatres.map(theatre => (
                <div key={theatre.id} className="item-card">
                  <div className="item-info">
                    <h3>{theatre.name}</h3>
                    <p><strong>Location:</strong> {theatre.location}</p>
                    <p><strong>Total Seats:</strong> {theatre.total_seats}</p>
                    <p><strong>Seats Per Row:</strong> {theatre.seats_per_row || 10}</p>
                    <p><strong>Layout:</strong> {Math.ceil(theatre.total_seats / (theatre.seats_per_row || 10))} rows × {theatre.seats_per_row || 10} seats</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteTheatre(theatre.id, theatre.name)}
                    className="btn delete-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Showtimes List Section */}
        <div className="admin-section">
          <h2>🕐 Current Showtimes</h2>
          {showtimes.length === 0 ? (
            <p style={{textAlign: 'center', color: '#666', padding: '2rem', fontSize: '1.1rem'}}>
              📭 No showtimes added yet
            </p>
          ) : (
            <div className="items-grid">
              {showtimes.map(showtime => (
                <div key={showtime.id} className="item-card">
                  <div className="item-info">
                    <h3>{showtime.movie_title}</h3>
                    <p><strong>Theatre:</strong> {showtime.theatre_name}</p>
                    <p><strong>Location:</strong> {showtime.theatre_location}</p>
                    <p><strong>Date:</strong> {new Date(showtime.show_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {showtime.show_time}</p>
                    <p><strong>Price:</strong> ₹{showtime.price}</p>
                  </div>
                  <div className="item-actions">
                    <button 
                      onClick={() => handleDeleteShowtime(
                        showtime.id, 
                        showtime.movie_title, 
                        showtime.theatre_name, 
                        new Date(showtime.show_date).toLocaleDateString(), 
                        showtime.show_time
                      )}
                      className="btn delete-btn"
                    >
                      🗑️ Delete
                    </button>
                    <button 
                      onClick={() => handleViewSeats(showtime)}
                      className="btn delete-btn"
                      style={{background: '#2563eb', borderColor: '#2563eb'}}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings Section */}
        <div className="admin-section">
          <h2>📋 Recent Bookings</h2>
          {bookings.length === 0 ? (
            <p style={{textAlign: 'center', color: '#666', padding: '2rem', fontSize: '1.1rem'}}>
              📭 No bookings yet
            </p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>🎫 Booking ID</th>
                    <th>👤 Customer</th>
                    <th>📧 Email</th>
                    <th>🎬 Movie</th>
                    <th>🏛️ Theatre</th>
                    <th>📅 Date & Time</th>
                    <th>🪑 Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>#{booking.id}</td>
                      <td>{booking.customer_name}</td>
                      <td>{booking.customer_email}</td>
                      <td>{booking.movie_title}</td>
                      <td>{booking.theatre_name}</td>
                      <td>{new Date(booking.show_date).toLocaleDateString()} {booking.show_time}</td>
                      <td>
                        <div className="seat-numbers">
                          {booking.seat_numbers && booking.seat_numbers.trim() ? 
                            booking.seat_numbers.split(', ').map((seat, index, array) => (
                              <span key={index}>
                                <span className="admin-seat-tag">{seat}</span>
                                {index < array.length - 1 && <span>, </span>}
                              </span>
                            )) 
                            : 
                            <span>{booking.total_seats} seat{booking.total_seats > 1 ? 's' : ''}</span>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seat View Modal */}
        {seatViewModal.isOpen && (
          <div className="modal-overlay" onClick={closeSeatViewModal}>
            <div className="modal-content seat-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💺 Seat Layout - {seatViewModal.showtime?.movie_title}</h2>
                <button className="modal-close" onClick={closeSeatViewModal}>✕</button>
              </div>
              <div className="modal-body">
                {seatViewModal.showtime && (
                  <div className="showtime-info">
                    <p><strong>🏛️ Theatre:</strong> {seatViewModal.showtime.theatre_name}</p>
                    <p><strong>📍 Location:</strong> {seatViewModal.showtime.theatre_location}</p>
                    <p><strong>📅 Date:</strong> {new Date(seatViewModal.showtime.show_date).toLocaleDateString()}</p>
                    <p><strong>🕐 Time:</strong> {seatViewModal.showtime.show_time}</p>
                    <p><strong>💰 Price:</strong> ₹{seatViewModal.showtime.price}</p>
                  </div>
                )}
                
                {seatViewModal.loading ? (
                  <div className="loading-message">🎬 Loading seat layout...</div>
                ) : (
                  <div className="admin-seat-layout">
                    <div className="screen">🎬 SCREEN 🎬</div>
                    
                    <div className="seat-legend">
                      <div className="legend-item">
                        <div className="legend-seat" style={{background: '#ffffff', border: '1px solid #e5e7eb'}}></div>
                        <span>Available</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-seat" style={{background: '#f59e0b'}}></div>
                        <span>Held</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-seat" style={{background: '#dc2626'}}></div>
                        <span>Booked</span>
                      </div>
                    </div>
                    
                    {seatViewModal.seats.length > 0 ? (
                      <div className="admin-seats-container">
                        {/* Group seats by row and display row-wise */}
                        {Object.entries(
                          seatViewModal.seats.reduce((rows, seat) => {
                            const rowLetter = seat.row_number || 'X';
                            if (!rows[rowLetter]) {
                              rows[rowLetter] = [];
                            }
                            rows[rowLetter].push(seat);
                            return rows;
                          }, {})
                        )
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([rowLetter, rowSeats]) => (
                          <div key={rowLetter} className="admin-seat-row">
                            <div className="admin-row-label">{rowLetter}</div>
                            <div className="admin-row-seats">
                              {rowSeats
                                .sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number))
                                .map(seat => {
                                  // Determine seat status
                                  let seatStatus = 'available';
                                  let statusText = 'Available';
                                  
                                  if (seat.is_booked) {
                                    seatStatus = 'booked';
                                    statusText = 'Booked';
                                  } else if (seat.status === 'held' || (seat.held_by_session && seat.hold_expires_at)) {
                                    seatStatus = 'held';
                                    statusText = 'Held';
                                  }
                                  
                                  return (
                                    <div
                                      key={seat.id}
                                      className={`admin-seat ${seatStatus}`}
                                      title={`Row ${seat.row_number}, Seat ${seat.seat_number} - ${statusText}`}
                                    >
                                      {seat.seat_number}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{textAlign: 'center', color: '#666', padding: '2rem'}}>
                        No seats found for this showtime.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
