import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MovieList from './components/MovieList';
import ShowtimeList from './components/ShowtimeList';
import SeatSelection from './components/SeatSelection';
import AdminPanel from './components/AdminPanel';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="container">
            <h1>CineBook</h1>
            <p className="tagline">Simple Movie Booking</p>
          </div>
        </header>
        
        <div className="container">
          <Routes>
            <Route path="/" element={<MovieList />} />
            <Route path="/movie/:movieId/showtimes" element={<ShowtimeList />} />
            <Route path="/showtime/:showtimeId/seats" element={<SeatSelection />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
