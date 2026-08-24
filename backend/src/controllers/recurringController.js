const { query } = require('../db');

async function getRecurring(req, res) {
  try {
    const userId = req.user.id;
    const recurring = await query(
      `SELECT r.*, c.name as category_name, c.color as category_color, a.name as account_name
       FROM recurring_transactions r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN accounts a ON r.account_id = a.id
       WHERE r.user_id = $1 ORDER BY r.next_date ASC`,
      [userId]
    );

    return res.json({ recurring });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch recurring transactions' });
  }
}

async function createRecurring(req, res) {
  try {
    const { account_id, category_id, type = 'expense', amount, description, frequency = 'monthly', start_date } = req.body;
    if (!amount || parseFloat(amount) <= 0 || !start_date) {
      return res.status(400).json({ error: 'Amount and start date are required' });
    }

    const startDateObj = new Date(start_date);
    const nextDateObj = new Date(startDateObj);

    const rows = await query(
      `INSERT INTO recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, start_date, next_date, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING *`,
      [req.user.id, account_id || null, category_id || null, type, parseFloat(amount), description || 'Recurring Item', frequency, startDateObj, nextDateObj]
    );

    return res.status(201).json({ message: 'Recurring transaction created', item: rows[0] });
  } catch (err) {
    console.error('createRecurring error:', err);
    return res.status(500).json({ error: 'Failed to create recurring transaction' });
  }
}

async function updateRecurring(req, res) {
  try {
    const { id } = req.params;
    const { is_active, amount, description, frequency } = req.body;

    await query(
      `UPDATE recurring_transactions SET is_active = $1, amount = $2, description = $3, frequency = $4 WHERE id = $5 AND user_id = $6`,
      [is_active !== undefined ? is_active : true, parseFloat(amount), description, frequency || 'monthly', id, req.user.id]
    );

    return res.json({ message: 'Recurring transaction updated' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update recurring transaction' });
  }
}

async function deleteRecurring(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    return res.json({ message: 'Recurring transaction deleted' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete recurring transaction' });
  }
}

module.exports = {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring
};
