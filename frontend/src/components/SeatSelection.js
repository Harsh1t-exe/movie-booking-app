import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movieAPI } from '../api';
import { sendBookingConfirmation, sendMockEmail } from '../services/emailService';

const SeatSelection = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [holding, setHolding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [seatsHeld, setSeatsHeld] = useState(false);
  const [holdTimer, setHoldTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sessionId] = useState(() => 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
  const [showtimeDetails, setShowtimeDetails] = useState(null);

  useEffect(() => {
    fetchSeats();
    // Refresh seats every 10 seconds to show real-time updates
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [showtimeId]);

  useEffect(() => {
    if (selectedSeats.length > 0 && !seatsHeld) {
      setShowContinueButton(true);
    } else {
      setShowContinueButton(false);
      if (!seatsHeld) {
        setShowModal(false);
      }
    }
  }, [selectedSeats, seatsHeld]);

  const fetchSeats = async () => {
    try {
      const response = await movieAPI.getSeats(showtimeId);
      setSeats(response.data);
      
      // Also fetch showtime details for email
      const showtimeResponse = await movieAPI.getShowtimeById(showtimeId);
      setShowtimeDetails(showtimeResponse.data);
    } catch (error) {
      console.error('Error fetching seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    // Don't allow selection if seat is booked or held by another user
    if (seat.is_booked || (seat.status === 'held' && seat.held_by_session !== sessionId)) return;
    
    // If seats are already held by this user, don't allow changing selection
    if (seatsHeld) return;

    if (selectedSeats.includes(seat.id)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat.id]);
    }
  };

  const getSeatClass = (seat) => {
    if (seat.is_booked) return 'seat booked';
    if (seat.status === 'held' && seat.held_by_session !== sessionId) return 'seat held';
    if (selectedSeats.includes(seat.id)) return 'seat selected';
    return 'seat available';
  };

  const handleContinue = async () => {
    if (selectedSeats.length === 0) return;
    
    setHolding(true);
    try {
      const response = await movieAPI.holdSeats({
        seatIds: selectedSeats,
        sessionId: sessionId
      });
      
      setSeatsHeld(true);
      setShowModal(true);
      setShowContinueButton(false);
      
      // Start 5-minute countdown timer
      setTimeRemaining(5 * 60); // 5 minutes in seconds
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setSeatsHeld(false);
            setSelectedSeats([]);
            setShowModal(false);
            fetchSeats(); // Refresh to show seats are released
            alert('Your seat hold has expired. Please select seats again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setHoldTimer(timer);
      
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to hold seats');
      setSelectedSeats([]);
    } finally {
      setHolding(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    if (!seatsHeld) {
      alert('Please hold seats first by clicking Continue');
      return;
    }

    setBooking(true);
    try {
      const bookingData = {
        showtimeId: parseInt(showtimeId),
        seatIds: selectedSeats,
        customerName,
        customerEmail,
        sessionId: sessionId
      };

      const response = await movieAPI.bookTickets(bookingData);
      
      // Clear the hold timer
      if (holdTimer) {
        clearInterval(holdTimer);
      }
      
      // Prepare email data
      const emailData = {
        email: customerEmail,
        name: customerName,
        movieTitle: showtimeDetails?.movie_title || 'Movie',
        theatreName: showtimeDetails?.theatre_name || 'Theatre',
        theatreLocation: showtimeDetails?.theatre_location || 'Location',
        showDate: showtimeDetails?.show_date || new Date().toISOString().split('T')[0],
        showTime: showtimeDetails?.show_time || '00:00',
        selectedSeats: getSelectedSeatNumbers(),
        bookingId: response.data.bookingId,
        totalAmount: showtimeDetails?.price ? (showtimeDetails.price * selectedSeats.length) : (100 * selectedSeats.length)
      };

      // Send email confirmation
      try {
        const emailResult = await sendBookingConfirmation(emailData); // Using mock for demo - change to sendBookingConfirmation for real emails
        
        if (emailResult.success) {
          alert(`🎉 Booking successful! 
          
Booking ID: ${response.data.bookingId}
          
📧 ${emailResult.message}
          
Check your email for ticket details!`);
        } else {
          alert(`Booking successful! Booking ID: ${response.data.bookingId}

⚠️ Email sending failed: ${emailResult.message}
Please save your booking details.`);
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        alert(`Booking successful! Booking ID: ${response.data.bookingId}

⚠️ Could not send confirmation email. Please save your booking details.`);
      }
      
      setShowModal(false);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const getSelectedSeatNumbers = () => {
    return selectedSeats.map(seatId => {
      const seat = seats.find(s => s.id === seatId);
      return seat ? `${seat.row_number}${seat.seat_number}` : '';
    }).filter(Boolean);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSeats([]);
    setCustomerName('');
    setCustomerEmail('');
    setShowContinueButton(false);
  };

  if (loading) return <div className="loading-message">🪑 Loading seats...</div>;

  return (
    <div>
      <Link to="/">
        <button className="btn back-btn">← Back to Movies</button>
      </Link>

      <div className="seats-container">
        <div className="screen">🎬 SCREEN 🎬</div>
        
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-seat" style={{background: '#ffffff', border: '1px solid #e5e7eb'}}></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat" style={{background: '#3b82f6'}}></div>
            <span>Selected</span>
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

        <div className="seats-grid">
          {seats.map(seat => (
            <div
              key={seat.id}
              className={getSeatClass(seat)}
              onClick={() => handleSeatClick(seat)}
              title={`Row ${seat.row_number}, Seat ${seat.seat_number}`}
            >
              {seat.row_number}{seat.seat_number}
            </div>
          ))}
        </div>

        {/* Continue Button */}
        {showContinueButton && (
          <div className="continue-section">
            <div className="selected-seats-preview">
              <strong>🎫 Selected Seats: </strong>
              {getSelectedSeatNumbers().map((seatNumber, index) => (
                <span key={index} className="seat-preview-tag">{seatNumber}</span>
              ))}
              <span className="seats-count">({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})</span>
            </div>
            <button 
              className="btn btn-continue" 
              onClick={handleContinue}
              disabled={holding}
            >
              {holding ? 'Holding Seats...' : 'Continue to Book →'}
            </button>
          </div>
        )}

        {/* Timer Display for Held Seats */}
        {seatsHeld && (
          <div className="hold-timer">
            <div className="timer-warning">
              ⏰ Seats held for: <strong>{formatTime(timeRemaining)}</strong>
              <br />
              <small>Complete your booking before time expires!</small>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎫 Book Your Tickets</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="selected-seats-display">
              <h4>Selected Seats:</h4>
              <div className="seats-list">
                {getSelectedSeatNumbers().map((seatNumber, index) => (
                  <span key={index} className="seat-tag">{seatNumber}</span>
                ))}
              </div>
              <p className="total-seats">Total: {selectedSeats.length} seat(s)</p>
            </div>

            <form onSubmit={handleBooking} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">👤 Full Name:</label>
                <input
                  type="text"
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">📧 Email:</label>
                <input
                  type="email"
                  id="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn btn-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success" 
                  disabled={booking}
                >
                  {booking ? '⏳ Booking...' : `🎉 Book ${selectedSeats.length} Ticket(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSelection;
