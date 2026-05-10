# IBM Cloudant Integration - Quick Start

## ✅ What's Been Added

Your application now has full IBM Cloudant integration with:

### 1. **Two Databases**
   - `appid-users` - Stores user profiles from IBM AppID login
   - `customer-bookings` - Stores all customer booking details

### 2. **Files Created/Modified**
   - ✅ `cloudant.js` - Cloudant service module (NEW)
   - ✅ `bookings.html` - Booking management UI (NEW)
   - ✅ `CLOUDANT_SETUP.md` - Detailed documentation (NEW)
   - ✅ `server.js` - Updated with Cloudant APIs
   - ✅ `.env` - Added Cloudant credentials
   - ✅ `package.json` - Added Cloudant SDK and UUID

### 3. **New API Endpoints**
   - `POST /api/bookings` - Create booking
   - `GET /api/bookings` - Get user's bookings
   - `GET /api/bookings/all` - Get all bookings
   - `GET /api/bookings/:id` - Get specific booking
   - `PUT /api/bookings/:id` - Update booking
   - `DELETE /api/bookings/:id` - Delete booking
   - `GET /api/bookings/status/:status` - Filter by status

## 🚀 Next Steps

### 1. Get IBM Cloudant Credentials
```
1. Go to IBM Cloud Console: https://cloud.ibm.com
2. Create/select Cloudant service
3. Get "Service credentials" (create if needed)
4. Copy: URL, username, password (API key)
```

### 2. Update .env File
```env
CLOUDANT_URL=https://YOUR-INSTANCE.cloudant.com
CLOUDANT_USERNAME=your_username
CLOUDANT_PASSWORD=your_api_key
CLOUDANT_API_KEY=your_api_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Server
```bash
npm start
```

### 5. Access Application
- Login: http://localhost:3000/auth/login
- Bookings: http://localhost:3000/bookings.html

## 📊 Database Structure

**Users Database:**
- User ID (from IBM AppID)
- Email, name, profile picture
- Login timestamps

**Bookings Database:**
- Booking ID (UUID)
- User ID (linked to AppID user)
- Customer details (name, email, phone)
- Service type and date/time
- Duration and notes
- Status (pending/confirmed/completed/cancelled)
- Timestamps

## 🔗 Integration Points

### When User Logs In:
1. IBM AppID validates credentials
2. User data automatically saved to `appid-users` database
3. Session created

### When Booking is Created:
1. User submits booking form
2. Booking saved to `customer-bookings` database
3. Linked to user via user ID
4. Status set to "pending"

### When Booking is Updated:
1. User or admin updates booking
2. Status can change to confirmed/completed/cancelled
3. Updated timestamp recorded

## 🔒 Security Features

- ✅ User authentication required for all booking APIs
- ✅ Users can only access their own bookings
- ✅ API key authentication for Cloudant
- ✅ Session-based authentication with Passport
- ✅ Input validation on all endpoints

## 📱 Frontend Integration

The `bookings.html` file includes:
- ✅ Create booking form
- ✅ View all user bookings
- ✅ Update booking status
- ✅ Delete booking
- ✅ Real-time status display
- ✅ Auto-refresh every 30 seconds

## 🐛 Testing the Integration

### Test User Login & Cloudant Save:
```bash
1. Visit http://localhost:3000/auth/login
2. Login with IBM AppID
3. Check Cloudant appid-users database
4. User document should be created
```

### Test Booking Creation:
```bash
1. Visit http://localhost:3000/bookings.html
2. Fill booking form
3. Click "Create Booking"
4. Check Cloudant customer-bookings database
5. New booking document should appear
```

### Test API with cURL:
```bash
# Login (get session)
curl -c cookies.txt http://localhost:3000/auth/login

# Create booking
curl -b cookies.txt -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "serviceType": "Consultation",
    "bookingDate": "2024-05-20",
    "bookingTime": "14:00",
    "duration": "60"
  }'

# Get bookings
curl -b cookies.txt http://localhost:3000/api/bookings
```

## 📚 Key Functions

### Saving User After Login (automatic)
```javascript
// Called automatically in passport strategy
await cloudant.saveUser(userData);
```

### Creating Booking
```javascript
const booking = await cloudant.createBooking({
  userId: user.sub,
  customerName: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  serviceType: "Consultation",
  bookingDate: "2024-05-20",
  bookingTime: "14:00",
  duration: "60",
  notes: "Special requests"
});
```

### Retrieving Bookings
```javascript
// Get user's bookings
const bookings = await cloudant.getUserBookings(userId);

// Get all bookings
const allBookings = await cloudant.getAllBookings(limit, skip);

// Get by status
const pending = await cloudant.getBookingsByStatus('pending');
```

## 🔧 Troubleshooting

### "Cannot find module @ibm-cloud/cloudant"
```bash
npm install
# Make sure dependencies are installed
```

### "Cloudant connection failed"
- Verify CLOUDANT_URL format: `https://xxxxx.cloudant.com`
- Check CLOUDANT_API_KEY is correct
- Ensure Cloudant service is active in IBM Cloud

### "Database creation failed"
- Check API key has write permissions
- Verify database names are lowercase

### User not saved to Cloudant
- Check that login was successful
- Verify CLOUDANT_DB_USERS exists in Cloudant console
- Check server logs for errors

## 📖 Documentation Files

- **CLOUDANT_SETUP.md** - Detailed setup guide
- **bookings.html** - Frontend UI example
- **cloudant.js** - Backend service module
- **server.js** - API endpoints

## 🎯 What Users Can Do Now

1. ✅ Sign in with IBM AppID (data saved to Cloudant)
2. ✅ Create bookings (saved to customer-bookings database)
3. ✅ View all their bookings
4. ✅ Update booking status
5. ✅ Cancel bookings
6. ✅ See real-time booking updates

## 📝 Sample Booking Workflow

```
1. User logs in via IBM AppID
   → User document created in appid-users database

2. User fills booking form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Service: "Consultation"
   - Date: "2024-05-20"
   - Time: "14:00"
   → Booking document created in customer-bookings database

3. Booking appears in their dashboard with:
   - Status: "pending"
   - All details visible
   - Option to confirm or cancel

4. Admin can update status:
   - pending → confirmed → completed
   - Or cancel anytime
```

## 🚀 Advanced Features to Add

- [ ] Email notifications on booking changes
- [ ] Admin dashboard for all bookings
- [ ] Booking confirmation/reminder emails
- [ ] Payment integration
- [ ] Calendar view of bookings
- [ ] Automated booking reports
- [ ] Timezone support
- [ ] Recurring bookings
- [ ] Customer ratings/reviews

## ❓ Questions?

Refer to:
1. **CLOUDANT_SETUP.md** - Comprehensive guide
2. **Server logs** - Check for error messages
3. **Cloudant Dashboard** - View actual documents
4. **Browser DevTools** - Check API responses

## ✨ You're Ready to Go!

Your IBM Cloudant integration is complete and ready for:
- ✅ User authentication & storage
- ✅ Customer booking management
- ✅ Real-time booking tracking
- ✅ Full CRUD operations on bookings
