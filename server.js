const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'yiftach-sign-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Serve static files from public directory
app.use(express.static('public'));

// Helper function to read data.json
function readData() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data.json:', error);
    return { panels: [] };
  }
}

// Helper function to write data.json
function writeData(data) {
  try {
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing data.json:', error);
    return false;
  }
}

// Helper function to read config.json or environment variables
function readConfig() {
  // Check environment variables first (for production/Railway)
  if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH) {
    return {
      username: process.env.ADMIN_USERNAME,
      passwordHash: process.env.ADMIN_PASSWORD_HASH
    };
  }
  
  // Fall back to config.json (for local development)
  try {
    const config = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
    return JSON.parse(config);
  } catch (error) {
    console.error('Error reading config.json:', error);
    return { username: 'admin', passwordHash: '' };
  }
}

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// API Routes

// GET /api/data - Get all panels data
app.get('/api/data', (req, res) => {
  const data = readData();
  res.json(data);
});

// POST /api/data - Update panels data (requires auth)
app.post('/api/data', requireAuth, (req, res) => {
  const { panels } = req.body;
  
  if (!panels || !Array.isArray(panels)) {
    return res.status(400).json({ error: 'Invalid data format' });
  }

  const data = { panels };
  if (writeData(data)) {
    res.json({ success: true, message: 'Data updated successfully' });
  } else {
    res.status(500).json({ error: 'Failed to update data' });
  }
});

// POST /api/login - Admin login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const config = readConfig();

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Login attempt:', { username, configUsername: config.username, hasHash: !!config.passwordHash });
  }

  if (username !== config.username) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (!config.passwordHash) {
    console.error('No password hash found in config');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const match = await bcrypt.compare(password, config.passwordHash);
    if (match) {
      req.session.authenticated = true;
      req.session.username = username;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/verify - Verify session
app.get('/api/verify', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
});

// POST /api/logout - Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logout successful' });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
