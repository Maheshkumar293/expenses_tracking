const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Register a new user and seed default financial accounts (Cash, Bank, UPI)
 */
async function register(req, res) {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields (name, username, email, password) are required.' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username or email already exists
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [cleanUsername.toLowerCase(), cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'This username or email is already registered. Please login.' });
    }

    // Hash user password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user to database
    const result = await query(
      'INSERT INTO users (username, email, password_hash, name) VALUES ($1, $2, $3, $4) RETURNING id, username, email, name, created_at',
      [cleanUsername, cleanEmail, passwordHash, name.trim()]
    );

    const newUser = result[0];

    // Seed default accounts for new user (Cash, Bank Account, UPI Wallet)
    await query("INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon) VALUES ($1, 'Cash', 'cash', 1000.00, 'INR', 'Wallet')", [newUser.id]);
    await query("INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon) VALUES ($1, 'Bank Account', 'bank', 25000.00, 'INR', 'Building')", [newUser.id]);
    await query("INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon) VALUES ($1, 'UPI Wallet', 'wallet', 2000.00, 'INR', 'Smartphone')", [newUser.id]);

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
}

/**
 * Login existing user with username or email + password
 */
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username/Email and password are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Search user by lowercased username or email
    const users = await query(
      'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $2',
      [cleanIdentifier, cleanIdentifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'No account found with this username or email. Please register.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
}

/**
 * Clear session cookie on logout
 */
async function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
}

/**
 * Fetch current user profile
 */
async function getMe(req, res) {
  try {
    const users = await query(
      'SELECT id, username, email, name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({ user: users[0] });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
}

/**
 * Update user profile details
 */
async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Check if new email is taken by another user
    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2',
      [cleanEmail, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'This email is already in use by another account.' });
    }

    const updated = await query(
      'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, name',
      [cleanName, cleanEmail, userId]
    );

    return res.json({
      message: 'Profile updated successfully',
      user: updated[0]
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * Change user account password
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const users = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);

    return res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ error: 'Failed to change password.' });
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
