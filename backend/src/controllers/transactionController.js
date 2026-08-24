const { query } = require('../db');
const { parseExpenseText } = require('../services/expenseParserService');
const { calculateAccountBalance } = require('../services/balanceService');

async function getTransactions(req, res) {
  try {
    const userId = req.user.id;
    const { category_id, account_id, type, source, search, startDate, endDate, limit = 50, page = 1 } = req.query;

    let sql = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon, a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (category_id) {
      sql += ` AND t.category_id = $${paramIndex++}`;
      params.push(category_id);
    }
    if (account_id) {
      sql += ` AND t.account_id = $${paramIndex++}`;
      params.push(account_id);
    }
    if (type) {
      sql += ` AND t.type = $${paramIndex++}`;
      params.push(type);
    }
    if (source) {
      sql += ` AND t.source = $${paramIndex++}`;
      params.push(source);
    }
    if (search) {
      sql += ` AND (t.description ILIKE $${paramIndex} OR t.merchant ILIKE $${paramIndex} OR t.transcription ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (startDate) {
      sql += ` AND t.transaction_date >= $${paramIndex++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND t.transaction_date <= $${paramIndex++}`;
      params.push(endDate);
    }

    sql += ` ORDER BY t.transaction_date DESC, t.id DESC`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const transactions = await query(sql, params);
    return res.json({ transactions });
  } catch (err) {
    console.error('getTransactions error:', err);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
}

async function getTransactionById(req, res) {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT t.*, c.name as category_name, a.name as account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    return res.json({ transaction: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch transaction' });
  }
}

async function createTransaction(req, res) {
  try {
    const userId = req.user.id;
    let {
      account_id,
      category_id,
      category_name,
      type = 'expense',
      amount,
      description,
      merchant,
      payment_method,
      transaction_date,
      source = 'manual',
      transcription,
      audio_url,
      notes
    } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid transaction amount is required' });
    }

    // Default account if not supplied
    if (!account_id) {
      const userAccounts = await query('SELECT id FROM accounts WHERE user_id = $1 ORDER BY id ASC LIMIT 1', [userId]);
      if (userAccounts.length > 0) {
        account_id = userAccounts[0].id;
      }
    }

    // Default category matching by category_name if category_id not specified
    if (!category_id && category_name) {
      const cats = await query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND (user_id = $2 OR user_id IS NULL) LIMIT 1', [category_name, userId]);
      if (cats.length > 0) {
        category_id = cats[0].id;
      }
    }

    if (!category_id) {
      const fallbackCat = await query("SELECT id FROM categories WHERE name = 'Other' LIMIT 1");
      if (fallbackCat.length > 0) category_id = fallbackCat[0].id;
    }

    const txDate = transaction_date ? new Date(transaction_date) : new Date();

    const result = await query(
      `INSERT INTO transactions
       (user_id, account_id, category_id, type, amount, description, merchant, payment_method, transaction_date, source, transcription, audio_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        account_id,
        category_id,
        type,
        parseFloat(amount),
        description || 'Expense',
        merchant || null,
        payment_method || null,
        txDate,
        source,
        transcription || null,
        audio_url || null,
        notes || null
      ]
    );

    const newTx = result[0];

    // Fetch updated account balance
    const updatedAccount = account_id ? await calculateAccountBalance(userId, account_id) : null;

    return res.status(201).json({
      message: 'Transaction saved successfully',
      transaction: newTx,
      account: updatedAccount
    });
  } catch (err) {
    console.error('createTransaction error:', err);
    return res.status(500).json({ error: 'Failed to create transaction' });
  }
}

async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      account_id,
      category_id,
      type,
      amount,
      description,
      merchant,
      payment_method,
      transaction_date,
      notes
    } = req.body;

    const existing = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await query(
      `UPDATE transactions
       SET account_id = $1, category_id = $2, type = $3, amount = $4, description = $5,
           merchant = $6, payment_method = $7, transaction_date = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 AND user_id = $11`,
      [
        account_id || existing[0].account_id,
        category_id || existing[0].category_id,
        type || existing[0].type,
        amount !== undefined ? parseFloat(amount) : existing[0].amount,
        description || existing[0].description,
        merchant !== undefined ? merchant : existing[0].merchant,
        payment_method !== undefined ? payment_method : existing[0].payment_method,
        transaction_date ? new Date(transaction_date) : existing[0].transaction_date,
        notes !== undefined ? notes : existing[0].notes,
        id,
        userId
      ]
    );

    const updatedRows = await query('SELECT * FROM transactions WHERE id = $1', [id]);
    return res.json({ message: 'Transaction updated successfully', transaction: updatedRows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update transaction' });
  }
}

async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    return res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete transaction' });
  }
}

async function parseText(req, res) {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text string is required for parsing' });
    }

    const parsed = await parseExpenseText(text);

    // Map matched category to ID if available
    let categoryObj = null;
    if (parsed.category) {
      const cats = await query(
        'SELECT id, name, icon, color FROM categories WHERE LOWER(name) = LOWER($1) AND (user_id = $2 OR user_id IS NULL) LIMIT 1',
        [parsed.category, req.user.id]
      );
      if (cats.length > 0) categoryObj = cats[0];
    }

    return res.json({
      parsed: {
        ...parsed,
        category_id: categoryObj ? categoryObj.id : null,
        category_name: parsed.category,
        category_icon: categoryObj ? categoryObj.icon : 'Folder',
        category_color: categoryObj ? categoryObj.color : '#3b82f6'
      }
    });
  } catch (err) {
    console.error('parseText error:', err);
    return res.status(500).json({ error: 'Failed to parse expense text' });
  }
}

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  parseText
};
