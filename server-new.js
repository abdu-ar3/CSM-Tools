const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Lark OAuth Configuration
const LARK_CLIENT_ID = 'cli_a9636165c6ba5ed3';
const LARK_CLIENT_SECRET = '6ZpkRpUkQWJ3YqOzw2phPeTJyhlk1UTp';
const LARK_REDIRECT_URI = 'http://localhost:3000/auth/lark/callback';

console.log('Loading server.js...');

// Configure Passport with Lark OAuth2
passport.use(new OAuth2Strategy({
    authorizationURL: 'https://open.larksuite.com/open-apis/authen/v1/authorize',
    tokenURL: 'https://open.larksuite.com/open-apis/authen/v1/access_token',
    clientID: LARK_CLIENT_ID,
    clientSecret: LARK_CLIENT_SECRET,
    callbackURL: LARK_REDIRECT_URI,
    scope: ['user.read']
  },
  function(accessToken, refreshToken, profile, done) {
    // Get user info from Lark
    axios.get('https://open.larksuite.com/open-apis/authen/v1/user_info', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      const userData = response.data;
      const user = {
        id: userData.data.user_id,
        name: userData.data.name,
        email: userData.data.email,
        avatar: userData.data.avatar_url,
        accessToken: accessToken
      };
      return done(null, user);
    })
    .catch(err => {
      console.error('Error getting user info:', err);
      return done(err, null);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(cors());
app.use(express.json());
app.use(session({
  secret: 'csm-dashboard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

console.log('Middleware configured');

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

console.log('Setting up routes...');

// Routes
app.get('/', (req, res) => {
  console.log('GET / - isAuthenticated:', req.isAuthenticated());
  if (req.isAuthenticated()) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  console.log('GET /login');
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Lark OAuth routes
app.get('/auth/lark',
  passport.authenticate('oauth2'));

app.get('/auth/lark/callback',
  passport.authenticate('oauth2', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to dashboard
    res.redirect('/');
  });

app.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  console.log('GET /test');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

console.log('Routes set up. Setting up static files...');

// Serve static frontend files from this directory
app.use(express.static(__dirname));

console.log('Static files configured');

// API routes (protected)
app.get('/api/user', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// API: Get all clients
app.get('/api/clients', requireAuth, (req, res) => {
    db.all("SELECT * FROM clients", [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// API: Create new client
app.post('/api/clients', requireAuth, (req, res) => {
    const { name, industry, plan, health_score, status } = req.body;
    const sql = 'INSERT INTO clients (name, industry, plan, health_score, status) VALUES (?,?,?,?,?)';
    const params = [name, industry || 'Other', plan || 'Basic', health_score || 0, status || 'Active'];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: { id: this.lastID, name, industry, plan, health_score, status }
        });
    });
});

// API: Get customer issues
app.get('/api/issues', requireAuth, (req, res) => {
    db.all('SELECT * FROM customer_issues ORDER BY updated_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// API: Create customer issue
app.post('/api/issues', requireAuth, (req, res) => {
    const { title, customer, description, status, priority, assigned_to } = req.body;
    const sql = 'INSERT INTO customer_issues (title, customer, description, status, priority, assigned_to) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [title, customer, description || '', status || 'Open', priority || 'Medium', assigned_to || ''];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'success', data: { id: this.lastID, title, customer, description, status, priority, assigned_to } });
    });
});

// API: Update customer issue
app.put('/api/issues/:id', requireAuth, (req, res) => {
    const issueId = req.params.id;
    const { title, customer, description, status, priority, assigned_to } = req.body;
    const sql = `UPDATE customer_issues SET title = COALESCE(?, title), customer = COALESCE(?, customer), description = COALESCE(?, description), status = COALESCE(?, status), priority = COALESCE(?, priority), assigned_to = COALESCE(?, assigned_to), updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    const params = [title || null, customer || null, description || null, status || null, priority || null, assigned_to || null, issueId];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'success' });
    });
});

// API: Delete customer issue
app.delete('/api/issues/:id', requireAuth, (req, res) => {
    const issueId = req.params.id;
    db.run('DELETE FROM customer_issues WHERE id = ?', [issueId], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

// API: Update client
app.put('/api/clients/:id', requireAuth, (req, res) => {
    const { name, industry, plan, health_score, status } = req.body;
    const sql = 'UPDATE clients SET name = ?, industry = ?, plan = ?, health_score = ?, status = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?';
    const params = [name, industry, plan, health_score, status, req.params.id];
    
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success" });
    });
});

// API: Delete client
app.delete('/api/clients/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM clients WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
});

// API: Get config
app.get('/api/config', requireAuth, (req, res) => {
    db.all("SELECT key, value FROM settings", [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        const config = {};
        rows.forEach(r => config[r.key] = r.value);
        res.json({ data: config });
    });
});

// API: Save config
app.post('/api/config', requireAuth, (req, res) => {
    const config = req.body;
    let hasError = false;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
        Object.keys(config).forEach(k => {
            stmt.run(k, config[k], (err) => { if(err) hasError = err; });
        });
        stmt.finalize();
        db.run("COMMIT", (err) => {
            if(err || hasError) res.status(400).json({ error: hasError || err });
            else res.json({ message: "success" });
        });
    });
});

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

console.log('All routes and middleware configured');

db.get("SELECT 1", (err) => {
    if (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
    console.log("Connected to the SQLite database.");
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
