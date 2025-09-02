import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movieAPI } from '../api';

const ShowtimeList = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShowtimes();
  }, [movieId]);

  const fetchShowtimes = async () => {
    try {
      const response = await movieAPI.getShowtimes(movieId);
      const allShowtimes = response.data;
      setShowtimes(allShowtimes);
      
      // Extract unique dates and sort them
      const dates = [...new Set(allShowtimes.map(showtime => showtime.show_date))].sort();
      setAvailableDates(dates);
      
      // Set default selected date to today or first available date
      const today = new Date().toISOString().split('T')[0];
      const defaultDate = dates.includes(today) ? today : dates[0];
      setSelectedDate(defaultDate);
    } catch (error) {
      console.error('Error fetching showtimes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter showtimes by selected date and group by theatre
  const filteredShowtimes = showtimes.filter(showtime => showtime.show_date === selectedDate);
  
  const groupedShowtimes = filteredShowtimes.reduce((groups, showtime) => {
    const key = `${showtime.theatre_name}_${showtime.location}`;
    if (!groups[key]) {
      groups[key] = {
        theatre_name: showtime.theatre_name,
        location: showtime.location,
        showtimes: []
      };
    }
    groups[key].showtimes.push(showtime);
    return groups;
  }, {});

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const tomorrowStr = tomorrow.toDateString();
    
    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === tomorrowStr) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const handleShowtimeSelect = (showtime) => {
    setSelectedShowtime(showtime);
    // Auto-navigate to seat selection (like BookMyShow)
    navigate(`/showtime/${showtime.id}/seats`);
  };

  if (loading) return <div className="loading-message">🎬 Loading showtimes...</div>;

  return (
    <div>
      <Link to="/">
        <button className="btn back-btn">← Back to Movies</button>
      </Link>
      
      <div className="showtimes">
        <h2>🕐 Select Showtime</h2>
        
        {/* Date Selector */}
        {availableDates.length > 0 && (
          <div className="date-selector">
            <h3>📅 Select Date:</h3>
            <div className="date-buttons">
              {availableDates.map(date => (
                <button
                  key={date}
                  className={`date-btn ${selectedDate === date ? 'date-btn-active' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="date-label">{formatDate(date)}</div>
                  <div className="date-full">{new Date(date).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {selectedDate && filteredShowtimes.length === 0 ? (
          <p style={{textAlign: 'center', color: '#666', fontSize: '1.1rem', padding: '2rem'}}>
            � No showtimes available for {formatDate(selectedDate)}.
          </p>
        ) : selectedDate && (
          <div className="theatres-list">
            {Object.values(groupedShowtimes).map((theatre, index) => (
              <div key={index} className="theatre-card">
                <div className="theatre-header">
                  <div className="theatre-info">
                    <h4 className="theatre-name">🏛️ {theatre.theatre_name}</h4>
                    <p className="theatre-location">📍 {theatre.location}</p>
                  </div>
                </div>
                
                <div className="showtimes-row">
                  {theatre.showtimes.map(showtime => (
                    <button 
                      key={showtime.id}
                      className={`showtime-btn ${showtime.booking_status === 'unavailable' ? 'showtime-btn-disabled' : ''} ${showtime.booking_status === 'completed' ? 'showtime-btn-completed' : ''}`}
                      onClick={() => showtime.booking_status === 'available' ? handleShowtimeSelect(showtime) : null}
                      disabled={showtime.booking_status !== 'available'}
                    >
                      <div className="showtime-time">{showtime.show_time}</div>
                      <div className="showtime-price">₹{showtime.price}</div>
                      {showtime.booking_status === 'unavailable' && <div className="showtime-status">Booking Closed</div>}
                      {showtime.booking_status === 'completed' && <div className="showtime-status">Show Over</div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowtimeList;
