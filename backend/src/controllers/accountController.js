const { query } = require('../db');
const { calculateAccountBalance } = require('../services/balanceService');

async function getAccounts(req, res) {
  try {
    const accounts = await calculateAccountBalance(req.user.id);
    return res.json({ accounts });
  } catch (err) {
    console.error('getAccounts error:', err);
    return res.status(500).json({ error: 'Failed to fetch accounts' });
  }
}

async function createAccount(req, res) {
  try {
    const { name, type, initial_balance = 0, currency = 'INR', icon = 'Wallet' } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Account name and type are required' });
    }

    const validTypes = ['cash', 'bank', 'credit_card', 'wallet', 'other'];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ error: `Account type must be one of: ${validTypes.join(', ')}` });
    }

    const rows = await query(
      `INSERT INTO accounts (user_id, name, type, initial_balance, currency, icon)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name.trim(), type.toLowerCase(), parseFloat(initial_balance) || 0, currency, icon]
    );

    const account = await calculateAccountBalance(req.user.id, rows[0].id);
    return res.status(201).json({ message: 'Account created successfully', account });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create account' });
  }
}

async function updateAccount(req, res) {
  try {
    const { id } = req.params;
    const { name, type, initial_balance, icon } = req.body;

    const existing = await query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await query(
      `UPDATE accounts SET name = $1, type = $2, initial_balance = $3, icon = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6`,
      [
        name || existing[0].name,
        type ? type.toLowerCase() : existing[0].type,
        initial_balance !== undefined ? parseFloat(initial_balance) : existing[0].initial_balance,
        icon || existing[0].icon,
        id,
        req.user.id
      ]
    );

    const account = await calculateAccountBalance(req.user.id, id);
    return res.json({ message: 'Account updated successfully', account });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update account' });
  }
}

async function deleteAccount(req, res) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    return res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete account' });
  }
}

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
};
