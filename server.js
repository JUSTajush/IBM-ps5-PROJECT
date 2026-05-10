require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const cloudant = require('./cloudant');

const app = express();

// Middleware
app.use(express.static('.'));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// OAuth2 Strategy for IBM App ID
passport.use('oauth2', new OAuth2Strategy(
  {
    authorizationURL: `${process.env.IBM_APPID_OAUTH_SERVER}/authorization`,
    tokenURL: `${process.env.IBM_APPID_OAUTH_SERVER}/token`,
    clientID: process.env.IBM_APPID_CLIENT_ID,
    clientSecret: process.env.IBM_APPID_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    state: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Get user info using access token
      const userResponse = await axios.get(
        `${process.env.IBM_APPID_OAUTH_SERVER}/userinfo`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const user = userResponse.data;
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      
      // Save user to Cloudant
      await cloudant.saveUser(user);
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/auth/login', passport.authenticate('oauth2', {
  scope: ['openid', 'profile', 'email']
}));

app.get('/auth/callback', passport.authenticate('oauth2', {
  successRedirect: '/dashboard',
  failureRedirect: '/'
}));

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: req.user.sub,
    email: req.user.email,
    name: req.user.name
  });
});

app.get('/api/session', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated() ? {
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name
    } : null
  });
});

app.get('/dashboard', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.sendFile(__dirname + '/dashboard.html');
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.redirect('/');
  });
});

// ========== BOOKING APIs ==========

// Create a booking
app.post('/api/bookings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const booking = {
      userId: req.user.sub,
      customerName: req.body.customerName,
      email: req.body.email || req.user.email,
      phone: req.body.phone,
      serviceType: req.body.serviceType,
      bookingDate: req.body.bookingDate,
      bookingTime: req.body.bookingTime,
      duration: req.body.duration,
      notes: req.body.notes,
    };

    const result = await cloudant.createBooking(booking);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's bookings
app.get('/api/bookings', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const bookings = await cloudant.getUserBookings(req.user.sub);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings (admin)
app.get('/api/bookings/all', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;

    const bookings = await cloudant.getAllBookings(limit, skip);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching all bookings:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get booking by ID
app.get('/api/bookings/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const booking = await cloudant.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.userId !== req.user.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update booking
app.put('/api/bookings/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const booking = await cloudant.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.userId !== req.user.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedBooking = await cloudant.updateBooking(req.params.id, req.body);
    res.json(updatedBooking);
  } catch (err) {
    console.error('Error updating booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete booking
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const booking = await cloudant.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.userId !== req.user.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await cloudant.deleteBooking(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Error deleting booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get bookings by status
app.get('/api/bookings/status/:status', async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const bookings = await cloudant.getBookingsByStatus(req.params.status);
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== Server Startup ==========

const PORT = process.env.PORT || 8000;

// Initialize Cloudant and start server
cloudant.initCloudant()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Login: http://localhost:${PORT}/auth/login`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize Cloudant:', err);
    process.exit(1);
  });
