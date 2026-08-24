require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Expense Tracker Backend running on port ${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start backend server:', err);
    process.exit(1);
  }
}

startServer();
