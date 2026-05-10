# IBM Cloudant Integration Guide

This application now integrates IBM Cloudant for:
1. **User Management** - Storing IBM AppID login and user data
2. **Booking Management** - Storing customer booking details

## Setup Instructions

### 1. Create IBM Cloudant Instance

1. Go to [IBM Cloud Console](https://cloud.ibm.com)
2. Create a new "Cloudant" service in your region
3. Once created, go to **Service credentials** and create new credentials
4. Copy the following from the credentials:
   - `URL` - The Cloudant instance URL
   - `username` - Your Cloudant username  
   - `password` - Your API key (use this as password)

### 2. Update Environment Variables

Edit `.env` file and update:

```
CLOUDANT_URL=https://your-instance-id.cloudant.com
CLOUDANT_USERNAME=your_cloudant_username
CLOUDANT_PASSWORD=your_api_key_here
CLOUDANT_API_KEY=your_api_key_here
CLOUDANT_DB_USERS=appid-users
CLOUDANT_DB_BOOKINGS=customer-bookings
```

### 3. Install Dependencies

```bash
npm install
```

This will install:
- `@ibm-cloud/cloudant` - IBM Cloudant SDK
- `uuid` - For generating unique booking IDs

### 4. Start the Application

```bash
npm start
# or for development with auto-reload
npm run dev
```

The server will:
- Connect to Cloudant
- Create two databases if they don't exist:
  - `appid-users` - Stores user profiles from IBM AppID
  - `customer-bookings` - Stores booking information

## Database Schema

### Users Database (`appid-users`)

```json
{
  "_id": "user-sub-id",
  "type": "user",
  "email": "user@example.com",
  "name": "Full Name",
  "givenName": "First",
  "familyName": "Last",
  "picture": "profile-picture-url",
  "createdAt": "2024-05-09T10:30:00Z",
  "lastLogin": "2024-05-09T14:45:00Z"
}
```

### Bookings Database (`customer-bookings`)

```json
{
  "_id": "booking-uuid",
  "type": "booking",
  "userId": "user-sub-id",
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "serviceType": "Consultation",
  "bookingDate": "2024-05-15",
  "bookingTime": "14:00",
  "duration": "60",
  "notes": "Any special requests",
  "status": "pending",
  "createdAt": "2024-05-09T10:30:00Z",
  "updatedAt": "2024-05-09T10:30:00Z"
}
```

## API Endpoints

### Authentication
- `GET /auth/login` - Start AppID login
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Logout user
- `GET /api/user` - Get current user info
- `GET /api/session` - Check session status

### Bookings (All require authentication)

#### Create Booking
```
POST /api/bookings
Body: {
  "customerName": "string",
  "email": "string",
  "phone": "string",
  "serviceType": "string",
  "bookingDate": "YYYY-MM-DD",
  "bookingTime": "HH:mm",
  "duration": "minutes",
  "notes": "string (optional)"
}
```

#### Get User's Bookings
```
GET /api/bookings
Response: Array of booking objects
```

#### Get All Bookings (Admin)
```
GET /api/bookings/all?limit=100&skip=0
```

#### Get Booking by ID
```
GET /api/bookings/:id
```

#### Update Booking
```
PUT /api/bookings/:id
Body: {
  "customerName": "string",
  "status": "pending|confirmed|completed|cancelled",
  ... other fields to update
}
```

#### Delete Booking
```
DELETE /api/bookings/:id
```

#### Get Bookings by Status
```
GET /api/bookings/status/:status
```

## Cloudant Functions (cloudant.js)

### User Functions
- `initCloudant()` - Initialize Cloudant connection
- `saveUser(userData)` - Save/update user after login
- `getUser(userId)` - Retrieve user by ID

### Booking Functions
- `createBooking(booking)` - Create new booking
- `getBooking(bookingId)` - Get booking by ID
- `getUserBookings(userId)` - Get all bookings for a user
- `getAllBookings(limit, skip)` - Get all bookings (paginated)
- `updateBooking(bookingId, updates)` - Update booking
- `deleteBooking(bookingId)` - Delete booking
- `getBookingsByStatus(status)` - Get bookings by status

## Integration Flow

### User Login Flow
1. User visits `/auth/login`
2. Redirected to IBM AppID login
3. After authentication, callback to `/auth/callback`
4. User data automatically saved to `appid-users` database
5. Session established and user redirected to `/dashboard`

### Booking Creation Flow
1. Authenticated user submits booking form
2. POST request to `/api/bookings` with booking details
3. System creates unique booking ID (UUID)
4. Booking saved to `customer-bookings` database
5. Response contains booking ID and confirmation

## Error Handling

- **401 Unauthorized** - User not authenticated
- **403 Forbidden** - User trying to access another user's booking
- **404 Not Found** - Booking/User not found
- **500 Server Error** - Database or server error

## Testing

You can test the API using cURL or Postman:

```bash
# Login first to get session
curl -c cookies.txt http://localhost:3000/auth/login

# Create a booking
curl -b cookies.txt -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "serviceType": "Consultation",
    "bookingDate": "2024-05-15",
    "bookingTime": "14:00",
    "duration": "60"
  }'

# Get all bookings
curl -b cookies.txt http://localhost:3000/api/bookings

# Update booking status
curl -b cookies.txt -X PUT http://localhost:3000/api/bookings/booking-id \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

## Security Notes

1. Always use API keys instead of passwords in production
2. Keep `.env` file secure and never commit it to git
3. Use HTTPS in production (not just HTTP)
4. Implement rate limiting for API endpoints
5. Validate and sanitize all input data
6. Consider implementing CORS if frontend is on different domain

## Troubleshooting

### "Cloudant connection failed"
- Verify `CLOUDANT_URL`, `CLOUDANT_USERNAME`, and `CLOUDANT_PASSWORD`
- Check that Cloudant instance is running
- Ensure credentials have proper permissions

### "Database creation failed"
- Check Cloudant service permissions
- Verify database name format (lowercase, no special chars)

### "User not found in Cloudant"
- Verify user completed AppID login
- Check `appid-users` database in Cloudant dashboard

### "Booking not found"
- Verify booking ID is correct
- Check that user owns the booking (userId match)

## Next Steps

1. Create frontend forms for booking management
2. Add booking confirmation emails
3. Implement admin dashboard for booking management
4. Add real-time notifications for new bookings
5. Implement booking status notifications
6. Add payment integration
7. Create reporting and analytics

## Resources

- [IBM Cloudant Documentation](https://cloud.ibm.com/docs/Cloudant)
- [IBM Cloudant SDK for Node.js](https://github.com/IBM/cloudant-node-sdk)
- [IBM AppID Documentation](https://cloud.ibm.com/docs/appid)
