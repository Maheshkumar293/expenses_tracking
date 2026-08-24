const { query } = require('../db');

async function getCategories(req, res) {
  try {
    const userId = req.user.id;
    // Get both global default categories and user custom categories
    const categories = await query(
      `SELECT * FROM categories WHERE user_id IS NULL OR user_id = $1 ORDER BY parent_id NULLS FIRST, name ASC`,
      [userId]
    );

    // Build hierarchy with subcategories
    const categoryMap = new Map();
    const result = [];

    for (const cat of categories) {
      if (!cat.parent_id) {
        cat.subcategories = [];
        categoryMap.set(cat.id, cat);
        result.push(cat);
      }
    }

    for (const cat of categories) {
      if (cat.parent_id && categoryMap.has(cat.parent_id)) {
        categoryMap.get(cat.parent_id).subcategories.push(cat);
      }
    }

    return res.json({ categories: result, raw: categories });
  } catch (err) {
    console.error('getCategories error:', err);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, type = 'expense', icon = 'Folder', color = '#3b82f6', parent_id = null } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await query(
      `INSERT INTO categories (user_id, name, type, icon, color, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, name.trim(), type, icon, color, parent_id ? parseInt(parent_id) : null]
    );

    return res.status(201).json({ message: 'Category created successfully', category: result[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create category' });
  }
}

module.exports = {
  getCategories,
  createCategory
};
