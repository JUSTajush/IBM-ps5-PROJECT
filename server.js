require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');

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

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Login: http://localhost:${PORT}/auth/login`);
});
