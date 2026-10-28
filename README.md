# IMovies — Full-Stack Movie Ticket Booking Website

A runnable MERN-style starter with React + Vite frontend, Express API, MongoDB, JWT authentication, movie/showtime browsing, seat selection, and booking history.

## Requirements
- Node.js 20+ (recommended)
- MongoDB local instance or MongoDB Atlas connection string
- npm

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Edit `server/.env` and set `MONGO_URI` and a long random `JWT_SECRET`. The API runs on `http://localhost:5000`.

### 2. Frontend
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## Demo data
On server startup, the API seeds a small set of sample movies if the database has no movies. Sample poster URLs are from images hosted by Unsplash; replace them with licensed images before public deployment.

## Features
- Responsive cinema-inspired UI
- Browse and search movies
- Filter by genre
- Movie details and showtimes
- Register/login with hashed passwords and JWT
- Select seats and create bookings
- Server-side seat availability validation
- View and cancel upcoming bookings
- MongoDB models for users, movies, and bookings

## Important production steps
- Use HTTPS and a managed database with backups.
- Configure `CLIENT_URL`, secrets, and CORS for your deployed domains.
- Add payment gateway integration only with a trusted provider.
- Add rate limiting, email verification/password reset, monitoring, and automated tests.
- For high concurrency, use a MongoDB transaction with a replica set or a dedicated inventory/hold workflow to guarantee seat claims across concurrent requests. The sample checks availability server-side, but a production ticketing system needs stronger transactional guarantees.
