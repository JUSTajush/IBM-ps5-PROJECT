# PS5 Luxe Rentals - IBM App ID Setup

## Overview
Web app for PS5 console rentals with IBM App ID authentication.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
The `.env` file already contains your IBM App ID credentials:
- Tenant ID
- Client ID & Secret
- OAuth endpoints

**Important:** Change `SESSION_SECRET` to a strong random string before deploying to production.

### 3. Start Server
```bash
npm start
```

Server runs on `http://localhost:3000`

## Features

### Authentication Flow
- **Login**: Click "Login" button → Redirects to IBM App ID → Returns with session
- **Protected Dashboard**: `/dashboard` accessible only to authenticated users
- **Logout**: Clears session and redirects to home page

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | GET | Initiates IBM App ID login |
| `/auth/callback` | GET | OAuth callback (IBM App ID redirects here) |
| `/auth/logout` | GET | Clears session and logs out |
| `/api/user` | GET | Get current user info (requires auth) |
| `/api/session` | GET | Check authentication status |
| `/dashboard` | GET | User dashboard (requires auth) |

## How It Works

1. User clicks "Login" → Redirected to `/auth/login`
2. Server initiates OAuth flow with IBM App ID
3. User logs in on IBM's server
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
