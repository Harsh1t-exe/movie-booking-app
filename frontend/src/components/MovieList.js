import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieAPI } from '../api';

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await movieAPI.getAllMovies();
      setMovies(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-message">🎬 Loading amazing movies...</div>;

  return (
    <div>
      <h2 className="now-showing-title">🎬 Now Showing</h2>
      <div className="movies-grid">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster">
              {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.title} />
              ) : (
                '🎭 ' + movie.title
              )}
            </div>
            <div className="movie-title">{movie.title}</div>
            <div className="movie-genre-duration">{movie.genre} • {movie.duration} mins</div>
            <div className="movie-details">
              <div>{movie.description}</div>
            </div>
            <Link to={`/movie/${movie.id}/showtimes`}>
              <button className="btn">🎫 Book Tickets</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieList;
