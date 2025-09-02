import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const movieAPI = {
  getAllMovies: () => api.get('/movies'),
  getShowtimes: (movieId) => api.get(`/movies/${movieId}/showtimes`),
  getShowtimeById: (showtimeId) => api.get(`/showtimes/${showtimeId}`),
  getSeats: (showtimeId) => api.get(`/showtimes/${showtimeId}/seats`),
  holdSeats: (holdData) => api.post('/seats/hold', holdData),
  bookTickets: (bookingData) => api.post('/bookings', bookingData),
};

export const adminAPI = {
  addMovie: (movieData) => api.post('/admin/movies', movieData),
  addTheatre: (theatreData) => api.post('/admin/theatres', theatreData),
  addShowtime: (showtimeData) => api.post('/admin/showtimes', showtimeData),
  getTheatres: () => api.get('/admin/theatres'),
  getShowtimes: () => api.get('/admin/showtimes'),
  getBookings: () => api.get('/admin/bookings'),
  deleteMovie: (movieId) => api.delete(`/admin/movies/${movieId}`),
  deleteTheatre: (theatreId) => api.delete(`/admin/theatres/${theatreId}`),
  deleteShowtime: (showtimeId) => api.delete(`/admin/showtimes/${showtimeId}`),
};

export default api;
