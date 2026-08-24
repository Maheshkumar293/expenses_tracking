const axios = require('axios');

/**
 * Natural Language Expense Parser Service
 * Supports Groq LLaMA models (free), OpenAI GPT, and Rule-based parser.
 */
async function parseExpenseText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return {
      type: 'expense',
      amount: 0,
      category: 'Other',
      subcategory: null,
      date: 'today',
      description: '',
      payment_method: null
    };
  }

  const cleanText = text.trim();
  const rawGroqKey = process.env.GROQ_API_KEY;
  const groqKey = rawGroqKey ? rawGroqKey.trim().replace(/^["']|["']$/g, '') : null;
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

  const systemPrompt = `You are an AI financial expense parser for a voice expense tracker app.
Parse the user's natural language input (in English, Tamil, or Tanglish) into JSON format.
Strict rules:
1. "type": "expense", "income", or "transfer". Default to "expense" unless income words (salary, income, credited, earned, சம்பளம், வந்தது) or transfer words are mentioned.
2. "amount": total numerical amount in INR (e.g. 500, 35000). Extract pure number.
3. "category": select best match from ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Healthcare", "Education", "Rent", "EMI", "Insurance", "Investment", "Salary", "Freelance", "Business", "Other"].
4. "subcategory": relevant subcategory if mentioned (e.g. "Petrol", "Lunch", "Groceries", "Electricity", "Tea") or null.
5. "date": "today", "yesterday", or YYYY-MM-DD string if specific date given. "Nethu" / "yesterday" = "yesterday".
6. "description": short concise item title (e.g., "Petrol", "Lunch", "Salary").
7. "payment_method": "UPI", "Cash", "Credit Card", "Bank", "Wallet", or null if not explicitly mentioned. DO NOT GUESS missing payment method.

Return strictly valid JSON only:
{
  "type": "expense",
  "amount": 500,
  "category": "Transport",
  "subcategory": "Petrol",
  "date": "today",
  "description": "Petrol",
  "payment_method": null
}`;

  // 1. Groq AI Parser with automatic model fallback & key sanitization
  if (groqKey && groqKey.startsWith('gsk_')) {
    const groqModels = [
      'llama-3.1-8b-instant',
      'llama3-70b-8192',
      'llama3-8b-8192',
      'mixtral-8x7b-32768',
      'llama-3.3-70b-versatile'
    ];

    for (const model of groqModels) {
      try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cleanText }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' }
        });

        const jsonContent = response.data.choices[0]?.message?.content;
        if (jsonContent) {
          const parsed = JSON.parse(jsonContent);
          return sanitizeParsedResult(parsed, cleanText);
        }
      } catch (err) {
        const errDetails = err.response?.data || err.message;
        console.warn(`Groq AI attempt (${model}) message:`, errDetails);
        if (err.response?.status === 401) {
          console.error('Groq API Key invalid or expired. Check GROQ_API_KEY in Render environment variables.');
          break;
        }
      }
    }
  }

  // 2. OpenAI GPT Parser
  if (apiKey) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });

      const jsonContent = response.data.choices[0]?.message?.content;
      if (jsonContent) {
        const parsed = JSON.parse(jsonContent);
        return sanitizeParsedResult(parsed, cleanText);
      }
    } catch (err) {
      console.error('OpenAI GPT expense parsing error:', err.response?.data || err.message);
    }
  }

  // 3. Robust Rule-Based Fallback
  return fallbackRuleBasedParser(cleanText);
}

/**
 * Ensures parsed data is safe, valid numbers & categories
 */
function sanitizeParsedResult(parsed, originalText) {
  return {
    type: ['expense', 'income', 'transfer'].includes(parsed.type?.toLowerCase()) ? parsed.type.toLowerCase() : 'expense',
    amount: typeof parsed.amount === 'number' && !isNaN(parsed.amount) ? Math.abs(parsed.amount) : parseAmountFromText(originalText),
    category: parsed.category || detectCategoryFromText(originalText),
    subcategory: parsed.subcategory || null,
    date: parsed.date || 'today',
    description: parsed.description || originalText,
    payment_method: parsed.payment_method || null
  };
}

function parseAmountFromText(text) {
  const match = text.match(/(\d+[\d,]*(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}

function detectCategoryFromText(text) {
  const t = text.toLowerCase();
  if (t.includes('petrol') || t.includes('diesel') || t.includes('auto') || t.includes('uber') || t.includes('bus')) return 'Transport';
  if (t.includes('food') || t.includes('lunch') || t.includes('dinner') || t.includes('tea') || t.includes('hotel') || t.includes('swiggy') || t.includes('zomato')) return 'Food';
  if (t.includes('rent') || t.includes('room')) return 'Rent';
  if (t.includes('recharge') || t.includes('current') || t.includes('eb') || t.includes('bill') || t.includes('wifi')) return 'Bills';
  if (t.includes('salary') || t.includes('income')) return 'Salary';
  return 'Other';
}

function fallbackRuleBasedParser(text) {
  const t = text.toLowerCase();
  let type = 'expense';
  if (t.includes('salary') || t.includes('income') || t.includes('credited') || t.includes('earned') || t.includes('வந்த')) {
    type = 'income';
  }

  const amount = parseAmountFromText(text);
  const category = detectCategoryFromText(text);

  let date = 'today';
  if (t.includes('nethu') || t.includes('yesterday')) {
    date = 'yesterday';
  }

  let payment_method = null;
  if (t.includes('upi') || t.includes('gpay') || t.includes('phonepe') || t.includes('paytm')) payment_method = 'UPI';
  else if (t.includes('cash')) payment_method = 'Cash';
  else if (t.includes('card')) payment_method = 'Credit Card';

  return {
    type,
    amount,
    category,
    subcategory: null,
    date,
    description: text,
    payment_method
  };
}

module.exports = { parseExpenseText };
