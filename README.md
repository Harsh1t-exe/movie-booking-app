# 🎬 CineBook - Movie Booking System

A full-stack movie booking application inspired by BookMyShow, built with React, Node.js, and PostgreSQL.


## Preview
- https://movie-booking-app-ebon.vercel.app
- https://movie-booking-app-ebon.vercel.app/admin

## ✨ Features

### 🎭 User Features
- **Movie Browsing** - View current movies with posters and details
- **Showtime Selection** - Choose date and time with smart filtering
- **Interactive Seat Selection** - Visual seat grid with real-time availability
- **Booking Management** - Complete booking flow with customer details
- **Email Confirmation** - Professional ticket confirmation emails
- **Responsive Design** - Works perfectly on desktop and mobile

### 👨‍💼 Admin Features
- **Movie Management** - Add/delete movies with details
- **Theatre Management** - Manage theatres and locations
- **Showtime Management** - Schedule shows with date/time/pricing
- **Seat Layout Viewing** - Visual seat status monitoring
- **Booking Overview** - View all customer bookings
- **Secure Access** - Password-protected admin panel

### 🔧 Technical Features
- **Real-time Seat Holding** - Prevents double bookings
- **5-Minute Booking Cutoff** - Realistic booking restrictions
- **Session Management** - Automatic seat release after timeout
- **Database Integrity** - Proper foreign keys and constraints
- **Email Integration** - EmailJS for confirmation emails

## 🚀 Tech Stack

**Frontend:**
- React.js with React Router
- Custom CSS with responsive design
- Axios for API calls

**Backend:**
- Node.js with Express
- PostgreSQL database
- Session-based seat holding

**Email Service:**
- EmailJS integration
- Professional HTML templates

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd movie
```

### 2. Database Setup
```bash
# Start PostgreSQL service
# Create database named 'moviebooking'
createdb moviebooking

# Run database setup
cd backend
node setup-db.js
```

### 3. Backend Setup
```bash
cd backend
npm install

# Create .env file with:
# DB_HOST=localhost
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=moviebooking
# PORT=5000

npm start
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 5. Access Application
- **Main App:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Admin Password:** `admin123`

## 📖 Usage Guide

### For Users:
1. Browse available movies on homepage
2. Click "Book Tickets" on desired movie
3. Select date from available options
4. Choose showtime and theatre
5. Select seats from interactive grid
6. Fill booking details and confirm
7. Receive email confirmation

### For Admins:
1. Go to `/admin` and login with `admin123`
2. Add movies, theatres, and showtimes
3. View seat layouts and booking status
4. Manage all data with delete functionality

## 🗂️ Project Structure

```
movie/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API and email services
│   │   └── index.css         # Styling
│   └── package.json
├── backend/                  # Node.js server
│   ├── server.js            # Main server file
│   ├── setup-db.js          # Database setup script
│   ├── .env                 # Environment variables
│   └── package.json
├── database/                 # Database schema
│   └── schema.sql           # Database setup
├── ADMIN_ACCESS.md          # Admin credentials
├── EMAIL_SETUP.md           # Email configuration guide
└── README.md                # This file
```

## 🔐 Admin Access

**URL:** `/admin`  
**Password:** `admin123`  
**Features:** Full CRUD operations for movies, theatres, showtimes

## 📧 Email Configuration

The app uses EmailJS for sending confirmation emails. See `EMAIL_SETUP.md` for detailed setup instructions.

**Current Status:** Mock email service (logs to console)  
**Production Ready:** Real email sending can be enabled in 5 minutes

## 🎯 Business Logic

### Seat Management
- Seats are held for 10 minutes when selected
- Automatic release if booking not completed
- Real-time status updates (Available/Held/Booked)

### Booking Restrictions
- 5-minute cutoff before showtime starts
- Date-wise showtime filtering
- Seat conflict prevention

### Data Integrity
- Foreign key relationships
- Cascade deletion handling
- Input validation and sanitization

## 🌟 Key Features

**User Experience:**
- No signup required - streamlined booking flow
- Professional UI with modern design
- Real-world business logic implementation
- Complete booking management system
- Email confirmation functionality

**Technical Highlights:**
- BookMyShow-inspired interface
- Time-based booking restrictions
- Session-based seat holding
- Comprehensive admin interface
- Scalable architecture

## 🔧 Development

### Database Schema
- **movies** - Movie information
- **theatres** - Theatre details with configurable seat layout
- **showtimes** - Show scheduling with pricing
- **seats** - Individual seat management
- **bookings** - Customer booking records

### API Endpoints
- `GET /api/movies` - List all movies
- `GET /api/movies/:id/showtimes` - Get showtimes for movie
- `GET /api/showtimes/:id/seats` - Get seat layout
- `POST /api/bookings` - Create new booking
- Admin endpoints for CRUD operations

## 🚀 Deployment

### Production Considerations
- Move admin password to environment variables
- Add JWT authentication for enhanced security
- Implement email service rate limiting
- Add monitoring and logging
- Set up database backups

### Environment Variables
```
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=moviebooking
PORT=5000
ADMIN_PASSWORD=secure_password
```

## 📄 License

This project is for educational and portfolio purposes.

## 🤝 Contributing

This is a portfolio project. Feel free to fork and create your own version!

---

**Built with modern web technologies for learning full-stack development**



