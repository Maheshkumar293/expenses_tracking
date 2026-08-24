const { query } = require('../db');

async function getBudgets(req, res) {
  try {
    const userId = req.user.id;
    const budgets = await query(
      `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [userId]
    );

    // Calculate current monthly spending per category
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0, 23, 59, 59);

    const enrichedBudgets = await Promise.all(
      budgets.map(async (b) => {
        // Query expenses for this category or its subcategories in current month
        const spentRows = await query(
          `SELECT SUM(amount) as total FROM transactions
           WHERE user_id = $1 AND (category_id = $2 OR category_id IN (SELECT id FROM categories WHERE parent_id = $2))
             AND type = 'expense'
             AND transaction_date >= $3 AND transaction_date <= $4`,
          [userId, b.category_id, startOfMonth, endOfMonth]
        );

        const spentAmount = parseFloat(spentRows[0]?.total || 0);
        const budgetAmount = parseFloat(b.amount);
        const percentage = budgetAmount > 0 ? Math.min(Math.round((spentAmount / budgetAmount) * 100), 100) : 0;

        return {
          ...b,
          amount: budgetAmount,
          spent: spentAmount,
          remaining: Math.max(0, budgetAmount - spentAmount),
          percentage
        };
      })
    );

    return res.json({ budgets: enrichedBudgets });
  } catch (err) {
    console.error('getBudgets error:', err);
    return res.status(500).json({ error: 'Failed to fetch budgets' });
  }
}

async function createBudget(req, res) {
  try {
    const { category_id, amount, period = 'monthly' } = req.body;
    if (!category_id || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Category ID and valid amount are required' });
    }

    // Check if budget already exists for category
    const existing = await query('SELECT * FROM budgets WHERE user_id = $1 AND category_id = $2', [req.user.id, category_id]);
    if (existing.length > 0) {
      await query('UPDATE budgets SET amount = $1, period = $2 WHERE id = $3', [parseFloat(amount), period, existing[0].id]);
      return res.json({ message: 'Budget updated successfully' });
    }

    const rows = await query(
      `INSERT INTO budgets (user_id, category_id, amount, period) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, category_id, parseFloat(amount), period]
    );

    return res.status(201).json({ message: 'Budget created successfully', budget: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create budget' });
  }
}

async function updateBudget(req, res) {
  try {
    const { id } = req.params;
    const { amount, period } = req.body;

    await query(
      `UPDATE budgets SET amount = $1, period = $2 WHERE id = $3 AND user_id = $4`,
      [parseFloat(amount), period || 'monthly', id, req.user.id]
    );

    return res.json({ message: 'Budget updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update budget' });
  }
}

async function deleteBudget(req, res) {
  try {
    const { id } = req.params;
    await query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    return res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete budget' });
  }
}

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
};
