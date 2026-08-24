const express = require('express');
const router = express.Router();
const { getTransactions, getTransactionById, createTransaction, updateTransaction, deleteTransaction, parseText } = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.post('/parse-text', parseText);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
