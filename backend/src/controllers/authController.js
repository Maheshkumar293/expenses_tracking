const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

async function register(req, res) {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields (username, email, password, name) are required.' });
    }

    // Check existing
    const existing = await query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username or Email is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      'INSERT INTO users (username, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, name, created_at',
      [username.trim(), email.trim().toLowerCase(), passwordHash, name.trim()]
    );

    const user = result[0];

    // Seed default accounts for new user (Cash, SBI Bank, UPI)
    await query("INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon) VALUES ($1, 'Cash', 'cash', 1000.00, 'INR', 'Wallet')", [user.id]);
    await query("INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon) VALUES ($1, 'Bank Account', 'bank', 25000.00, 'INR', 'Building')", [user.id]);
    await query("INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon) VALUES ($1, 'UPI Wallet', 'wallet', 2000.00, 'INR', 'Smartphone')", [user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: user.id, username: user.username, email: user.email, name: user.name },
      token
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier can be email or username

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const users = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [identifier.trim(), identifier.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username, email: user.email, name: user.name },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}

async function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
}

async function getMe(req, res) {
  try {
    const users = await query('SELECT id, username, email, name, created_at FROM users WHERE id = $1', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: users[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user info' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    await query('UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', [name.trim(), email.trim().toLowerCase(), req.user.id]);
    return res.json({ message: 'Profile updated successfully', user: { id: req.user.id, name, email, username: req.user.username } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    const users = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, req.user.id]);

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to change password' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword
};
