# API Documentation — VoxExpense Backend

Base URL: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

- `POST /api/auth/register` — Register a new user (`username`, `email`, `password`, `name`). Seeds initial accounts automatically.
- `POST /api/auth/login` — Login with username or email + password. Returns token & sets HTTP-only cookie.
- `POST /api/auth/logout` — Clears authentication session cookie.
- `GET /api/auth/me` — Fetch current logged-in user profile.
- `PUT /api/auth/profile` — Update name or email.
- `PUT /api/auth/change-password` — Change account password.

---

## 2. Transaction Endpoints

- `GET /api/transactions` — Query transactions with filtering (`search`, `category_id`, `account_id`, `type`, `startDate`, `endDate`, `limit`, `page`).
- `POST /api/transactions` — Create manual or confirmed transaction.
- `GET /api/transactions/:id` — Get single transaction details.
- `PUT /api/transactions/:id` — Update transaction fields.
- `DELETE /api/transactions/:id` — Delete transaction.
- `POST /api/transactions/parse-text` — Parse natural language text input into structured transaction JSON.

---

## 3. Voice Endpoints

- `POST /api/voice/transcribe` — Accepts multipart audio file (`audio`) or simulation text. Returns speech transcript.
- `POST /api/voice/parse` — Accepts transcript string. Returns structured expense object.

---

## 4. Accounts, Budgets & Categories

- `GET /api/accounts` — Fetch all accounts with real-time calculated balances.
- `POST /api/accounts` — Create new account (Cash, Bank, Credit Card, Wallet).
- `GET /api/budgets` — Fetch category budget caps and current spent percentage.
- `POST /api/budgets` — Create/Update budget limit.
- `GET /api/categories` — Fetch available expense/income categories and subcategories.
