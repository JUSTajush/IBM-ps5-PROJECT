# PS5 Luxe Rentals - IBM App ID Setup

## Overview
Web app for PS5 console rentals with IBM App ID authentication and IBM Cloudant database.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The `.env` file contains your IBM App ID credentials:
- Tenant ID
- Client ID & Secret
- OAuth endpoints

**Important:** Change `SESSION_SECRET` to a strong random string before deploying to production.

### 3. Configure IBM Cloudant
Update the `.env` file with your Cloudant credentials:
```env
CLOUDANT_URL=https://YOUR-INSTANCE.cloudant.com
CLOUDANT_USERNAME=your_username
CLOUDANT_PASSWORD=your_api_key
CLOUDANT_API_KEY=your_api_key
```

### 4. Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

## Features

### Authentication Flow
- **Login**: Click "Login" button → Redirects to IBM App ID → Returns with session
- **Cloudant Storage**: User data automatically saved to `appid-users` database
- **Protected Dashboard**: `/dashboard` accessible only to authenticated users
- **Logout**: Clears session and redirects to home page

### Booking Management
- **Create Bookings**: Authenticated users can create customer bookings
- **View Bookings**: Users see all their bookings with status
- **Update Bookings**: Change booking status (pending, confirmed, completed, cancelled)
- **Delete Bookings**: Cancel bookings when needed
- **Cloudant Storage**: All booking data persisted in `customer-bookings` database

### API Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---|
| `/auth/login` | GET | Initiates IBM App ID login | No |
| `/auth/callback` | GET | OAuth callback | No |
| `/auth/logout` | GET | Clears session | Yes |
| `/api/user` | GET | Get current user info | Yes |
| `/api/session` | GET | Check authentication status | No |
| `/dashboard` | GET | User dashboard | Yes |
| `/api/bookings` | POST | Create booking | Yes |
| `/api/bookings` | GET | Get user's bookings | Yes |
| `/api/bookings/:id` | GET | Get specific booking | Yes |
| `/api/bookings/:id` | PUT | Update booking | Yes |
| `/api/bookings/:id` | DELETE | Delete booking | Yes |
| `/api/bookings/all` | GET | Get all bookings (paginated) | Yes |
| `/api/bookings/status/:status` | GET | Get bookings by status | Yes |

## Database Schema

### Users Database (`appid-users`)
Automatically created and populated on first login with:
- User ID (from IBM AppID)
- Email, name, profile picture
- Created and last login timestamps

### Bookings Database (`customer-bookings`)
Created when first booking is made with:
- Booking ID (UUID)
- Linked user ID
- Customer details (name, email, phone)
- Service type and booking date/time
- Duration and notes
- Status tracking (pending/confirmed/completed/cancelled)
4. IBM redirects back to `/auth/callback` with auth code
5. Server exchanges code for user info and creates session
6. User logged in and can access protected resources

## File Structure
```
.
├── server.js          # Express server with auth
├── .env              # IBM App ID credentials
├── package.json      # Dependencies
├── index.html        # Home page with login button
├── dashboard.html    # Protected user dashboard
├── script.js         # Frontend logic
├── style.css         # Styling
└── .gitignore        # Hide .env from git
```

## Security Notes

- `.env` is in `.gitignore` - never commit credentials
- Session secret should be changed in production
- Use HTTPS in production (set `cookie.secure = true` in server.js)
- CALLBACK_URL must match IBM App ID configuration

## Deployment

When deploying to production:
1. Update `.env` with production IBM App ID credentials
2. Change `SESSION_SECRET` to a random strong string
3. Update `CALLBACK_URL` to your production domain
4. Enable HTTPS and set `cookie.secure = true`
