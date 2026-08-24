const { query } = require('../db');

/**
 * Calculates current real balance for all accounts or a specific account.
 * NEVER relies on AI. Derived purely from PostgreSQL transactions table.
 */
async function calculateAccountBalance(userId, accountId = null) {
  let sqlAccounts = 'SELECT * FROM accounts WHERE user_id = $1';
  let accountParams = [userId];
  if (accountId) {
    sqlAccounts += ' AND id = $2';
    accountParams.push(accountId);
  }

  const accounts = await query(sqlAccounts, accountParams);

  const results = [];

  for (const account of accounts) {
    const accId = account.id;
    const initialBal = parseFloat(account.initial_balance) || 0;

    // Income total for this account
    const incomeRows = await query(
      "SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND account_id = $2 AND type = 'income'",
      [userId, accId]
    );
    const incomeTotal = parseFloat(incomeRows[0]?.total || 0);

    // Expense total for this account
    const expenseRows = await query(
      "SELECT SUM(amount) as total FROM transactions WHERE user_id = $1 AND account_id = $2 AND type = 'expense'",
      [userId, accId]
    );
    const expenseTotal = parseFloat(expenseRows[0]?.total || 0);

    const currentBalance = initialBal + incomeTotal - expenseTotal;

    results.push({
      ...account,
      initial_balance: initialBal,
      current_balance: currentBalance,
      total_income: incomeTotal,
      total_expense: expenseTotal
    });
  }

  return accountId ? results[0] : results;
}

module.exports = {
  calculateAccountBalance
};
