require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const cloudant = require('./cloudant');
const nodemailer = require('nodemailer');

const app = express();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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

app.get('/auth/callback', (req, res, next) => {
  passport.authenticate('oauth2', (err, user, info) => {
    if (err || !user) return res.redirect('/');
    req.logIn(user, (err) => {
      if (err) return next(err);
      if (user.email === 'gamaa.rental@gmail.com') {
        return res.redirect('/admin');
      }
      return res.redirect('/dashboard');
    });
  })(req, res, next);
});

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

// Admin Portal Route
app.get('/admin', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.sendFile(__dirname + '/admin.html');
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
    
    // --- Send Email Notifications ---
    try {
      // 1. Email to Customer
      const customerMailOptions = {
        from: `"PS5 Luxe Rentals" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: 'Booking Confirmed - PS5 Luxe Rentals',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #C9A24A;">Booking Received!</h2>
            <p>Hi <strong>${booking.customerName}</strong>,</p>
            <p>Thank you for choosing PS5 Luxe Rentals. Your booking request has been received and is currently <strong>PENDING</strong> confirmation.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Package:</strong> ${booking.serviceType}</p>
              <p><strong>Delivery Date:</strong> ${booking.bookingDate} at ${booking.bookingTime}</p>
              <p><strong>Duration:</strong> ${booking.duration} Hours</p>
            </div>
            <p>We will contact you shortly to confirm the delivery details. You can check your status anytime on your <a href="http://localhost:8000/dashboard" style="color: #C9A24A;">Dashboard</a>.</p>
            <p>Best regards,<br><strong>PS5 Luxe Rentals Team</strong></p>
          </div>
        `
      };

      // 2. Email to Admin
      const adminMailOptions = {
        from: `"PS5 Luxe System" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: '🚨 NEW BOOKING: ' + booking.serviceType,
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #c0392b;">New Booking Alert!</h2>
            <p><strong>Customer:</strong> ${booking.customerName} (${booking.phone})</p>
            <p><strong>Package:</strong> ${booking.serviceType} for ${booking.duration} hours</p>
            <p><strong>When:</strong> ${booking.bookingDate} at ${booking.bookingTime}</p>
            <br>
            <a href="http://localhost:8000/admin" style="background: #C9A24A; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">View in Admin Portal</a>
          </div>
        `
      };

      await transporter.sendMail(customerMailOptions);
      await transporter.sendMail(adminMailOptions);
      console.log('✓ Confirmation emails sent');
    } catch (emailErr) {
      console.error('Error sending emails:', emailErr);
    }

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

    // Basic Admin Check - CHANGE THIS TO YOUR LOGIN EMAIL
    const isAdmin = req.user.email === 'gamaa.rental@gmail.com';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
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

    // Basic Admin Check - CHANGE THIS TO YOUR LOGIN EMAIL
    const isAdmin = req.user.email === 'gamaa.rental@gmail.com';

    // Check if user owns this booking OR is an admin
    if (booking.userId !== req.user.sub && !isAdmin) {
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

    // Basic Admin Check - CHANGE THIS TO YOUR LOGIN EMAIL
    const isAdmin = req.user.email === 'gamaa.rental@gmail.com';

    // Check if user owns this booking OR is an admin
    if (booking.userId !== req.user.sub && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Security Check: Prevent users from modifying unauthorized fields or statuses
    const updates = req.body;
    if (!isAdmin) {
      // Users can only cancel their bookings (cannot confirm/complete them)
      if (updates.status && updates.status !== 'cancelled') {
        return res.status(403).json({ error: 'Users can only cancel bookings' });
      }
      if (updates.status === 'cancelled' && booking.status !== 'pending') {
        return res.status(400).json({ error: 'You can only cancel pending bookings' });
      }
    }

    const updatedBooking = await cloudant.updateBooking(req.params.id, updates);

    // --- Send Email on Confirmation ---
    if (isAdmin && updates.status === 'confirmed' && booking.status !== 'confirmed') {
      try {
        const confirmedMailOptions = {
          from: `"PS5 Luxe Rentals" <${process.env.EMAIL_USER}>`,
          to: booking.email,
          subject: '✅ Booking Confirmed! - PS5 Luxe Rentals',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #27ae60;">Your Booking is Confirmed!</h2>
              <p>Hi <strong>${booking.customerName}</strong>,</p>
              <p>Great news! Your PS5 rental booking has been <strong>CONFIRMED</strong>.</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Package:</strong> ${booking.serviceType}</p>
                <p><strong>Delivery Date:</strong> ${booking.bookingDate} at ${booking.bookingTime}</p>
                <p><strong>Duration:</strong> ${booking.duration} Hours</p>
              </div>
              <p>Get ready for some next-gen gaming. We will see you at the scheduled delivery time!</p>
              <p>Best regards,<br><strong>PS5 Luxe Rentals Team</strong></p>
            </div>
          `
        };
        await transporter.sendMail(confirmedMailOptions);
        console.log(`✓ Confirmation email sent to ${booking.email}`);
      } catch (emailErr) {
        console.error('Error sending confirmation email:', emailErr);
      }
    }

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
