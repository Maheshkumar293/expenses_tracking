// PostgreSQL & SQLite table schema definitions

const POSTGRES_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'expense',
  icon VARCHAR(50) DEFAULT 'folder',
  color VARCHAR(50) DEFAULT '#3b82f6',
  parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'wallet', 'other')),
  initial_balance DECIMAL(12, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'INR',
  icon VARCHAR(50) DEFAULT 'wallet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  account_id INT REFERENCES accounts(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  merchant VARCHAR(100),
  payment_method VARCHAR(50),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'text', 'voice', 'receipt')),
  transcription TEXT,
  audio_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  account_id INT REFERENCES accounts(id) ON DELETE SET NULL,
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  next_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'expense',
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#3b82f6',
  parent_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initial_balance REAL DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  icon TEXT DEFAULT 'wallet',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  account_id INTEGER,
  category_id INTEGER,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  merchant TEXT,
  payment_method TEXT,
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'manual',
  transcription TEXT,
  audio_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  category_id INTEGER,
  amount REAL NOT NULL,
  period TEXT DEFAULT 'monthly',
  start_date TEXT,
  end_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  account_id INTEGER,
  category_id INTEGER,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  next_date TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);
`;

const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'Utensils', color: '#f59e0b', subcategories: ['Petrol', 'Groceries', 'Restaurants', 'Tea', 'Snacks'] },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#3b82f6', subcategories: ['Petrol', 'Diesel', 'Bus', 'Train', 'Taxi', 'Maintenance'] },
  { name: 'Bills', type: 'expense', icon: 'FileText', color: '#ef4444', subcategories: ['Electricity', 'Water', 'Internet', 'Mobile', 'Gas'] },
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899', subcategories: ['Clothing', 'Electronics', 'Home', 'Personal'] },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6', subcategories: ['Movies', 'Games', 'OTT Subscriptions', 'Outings'] },
  { name: 'Healthcare', type: 'expense', icon: 'Activity', color: '#10b981', subcategories: ['Medicines', 'Doctor Visit', 'Lab Tests'] },
  { name: 'Education', type: 'expense', icon: 'BookOpen', color: '#06b6d4', subcategories: ['Tuition', 'Books', 'Courses'] },
  { name: 'Rent', type: 'expense', icon: 'Home', color: '#f97316', subcategories: ['House Rent', 'Office Rent'] },
  { name: 'EMI', type: 'expense', icon: 'CreditCard', color: '#6366f1', subcategories: ['Home Loan', 'Car Loan', 'Personal Loan'] },
  { name: 'Insurance', type: 'expense', icon: 'Shield', color: '#14b8a6', subcategories: ['Health', 'Vehicle', 'Life'] },
  { name: 'Investment', type: 'expense', icon: 'TrendingUp', color: '#84cc16', subcategories: ['SIP', 'Stocks', 'FD', 'Crypto'] },
  { name: 'Salary', type: 'income', icon: 'DollarSign', color: '#22c55e', subcategories: ['Monthly Salary', 'Bonus'] },
  { name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#a855f7', subcategories: ['Client Work', 'Gigs'] },
  { name: 'Business', type: 'income', icon: 'Building', color: '#0284c7', subcategories: ['Sales', 'Services'] },
  { name: 'Other', type: 'expense', icon: 'Folder', color: '#6b7280', subcategories: ['General'] }
];

module.exports = {
  POSTGRES_SCHEMA,
  SQLITE_SCHEMA,
  DEFAULT_CATEGORIES
};
