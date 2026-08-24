const { transcribeAudio } = require('../services/speechToTextService');
const { parseExpenseText } = require('../services/expenseParserService');
const { query } = require('../db');

async function transcribe(req, res) {
  try {
    const file = req.file;
    const customText = req.body.text || req.query.text;

    let audioBuffer = null;
    let originalName = 'recording.webm';

    if (file) {
      audioBuffer = file.buffer;
      originalName = file.originalname || 'recording.webm';
    }

    const { transcript, language, source } = await transcribeAudio(audioBuffer, originalName, customText);

    return res.json({
      transcript,
      language,
      source
    });
  } catch (err) {
    console.error('Voice transcribe error:', err);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}

async function parseVoice(req, res) {
  try {
    const { transcript, text } = req.body;
    const rawText = transcript || text;

    if (!rawText) {
      return res.status(400).json({ error: 'Transcript text is required' });
    }

    const parsed = await parseExpenseText(rawText);

    // Find category ID matching parsed category
    let categoryObj = null;
    if (parsed.category) {
      const cats = await query(
        'SELECT id, name, icon, color FROM categories WHERE LOWER(name) = LOWER($1) AND (user_id = $2 OR user_id IS NULL) LIMIT 1',
        [parsed.category, req.user.id]
      );
      if (cats.length > 0) categoryObj = cats[0];
    }

    return res.json({
      transcript: rawText,
      parsed: {
        ...parsed,
        category_id: categoryObj ? categoryObj.id : null,
        category_name: parsed.category,
        category_icon: categoryObj ? categoryObj.icon : 'Folder',
        category_color: categoryObj ? categoryObj.color : '#3b82f6'
      }
    });
  } catch (err) {
    console.error('Voice parse error:', err);
    return res.status(500).json({ error: 'Failed to parse voice transcript' });
  }
}

module.exports = {
  transcribe,
  parseVoice
};
