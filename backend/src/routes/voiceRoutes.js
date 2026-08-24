const express = require('express');
const router = express.Router();
const multer = require('multer');
const { transcribe, parseVoice } = require('../controllers/voiceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.post('/transcribe', upload.single('audio'), transcribe);
router.post('/parse', parseVoice);

module.exports = router;
