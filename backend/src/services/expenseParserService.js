const axios = require('axios');

/**
 * Natural Language Expense Parser Service
 * Supports Groq AI models (free), OpenAI GPT, and a Rule-Based fallback.
 *
 * Flow: Groq AI → OpenAI GPT → Rule-Based Fallback
 */
async function parseExpenseText(text) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return buildDefault('');
  }

  const cleanText = text.trim();

  // Sanitize the API key — removes accidental quotes/spaces when pasted in Render
  const rawGroqKey = process.env.GROQ_API_KEY;
  const groqKey = rawGroqKey ? rawGroqKey.trim().replace(/^["']|["']$/g, '') : null;

  // Debug: shows key length on Render logs so you can verify it's correctly set
  if (groqKey) {
    console.log(`Groq key check — length: ${groqKey.length}, prefix: ${groqKey.substring(0, 8)}...`);
  } else {
    console.warn('GROQ_API_KEY is missing or empty in environment variables.');
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;

  // System prompt — instructs AI to ALWAYS return a JSON object, never null
  const systemPrompt = `You are an AI financial expense parser for a voice expense tracker app.
Parse the user's natural language input (which may be in English, Tamil, Hindi, or Tanglish) into a JSON object.

IMPORTANT RULES:
1. "type": Must be "expense", "income", or "transfer". Default to "expense".
   - Use "income" only for: salary, income, credited, earned, சம்பளம், வந்தது
2. "amount": A positive number in INR. Extract from text (e.g. "500 rupees" → 500). Default to 0 if unclear.
3. "category": Pick the best match from this list:
   ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Healthcare", "Education", "Rent", "EMI", "Insurance", "Investment", "Salary", "Freelance", "Business", "Other"]
   Default to "Other" if unsure.
4. "subcategory": A short label like "Petrol", "Lunch", "Groceries", "Tea", or null if not mentioned.
5. "date": "today", "yesterday", or a YYYY-MM-DD string. "Nethu" = "yesterday". Default to "today".
6. "description": A short title for the expense. PRESERVE the exact words and language (Tamil, Tanglish, Hindi, or English) as spoken or written by the user. DO NOT translate the description into Hindi or any other language.
7. "payment_method": "UPI", "Cash", "Credit Card", "Bank", "Wallet", or null. DO NOT guess — only set if explicitly mentioned.

CRITICAL: You MUST always return a valid JSON object. NEVER return null, undefined, or plain text.
Even if the input is unclear, return your best guess with default values.

Example output:
{
  "type": "expense",
  "amount": 500,
  "category": "Transport",
  "subcategory": "Petrol",
  "date": "today",
  "description": "Petrol",
  "payment_method": null
}`;

  // 1. Groq AI Parser — uses confirmed-active models for this account
  if (groqKey && groqKey.startsWith('gsk_')) {
    const groqModels = [
      'openai/gpt-oss-20b',    // Fast 20B model — primary choice
      'groq/compound-mini',    // Groq's fast compound model — fallback
      'groq/compound',         // Groq's full compound model — fallback
      'qwen/qwen3.6-27b',     // Qwen large model — final fallback
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
          // NOTE: We intentionally do NOT use response_format: { type: "json_object" }
          // because some models return null for unclear inputs which causes a hard API error.
          // Instead, we extract JSON manually from the response text below.
        }, {
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' }
        });

        const rawContent = response.data.choices[0]?.message?.content;
        if (rawContent) {
          const parsed = extractJsonFromText(rawContent);
          if (parsed) {
            console.log(`Groq AI (${model}) parsed successfully.`);
            return sanitizeParsedResult(parsed, cleanText);
          }
        }
      } catch (err) {
        const errDetails = err.response?.data || err.message;
        console.warn(`Groq AI attempt (${model}) failed:`, errDetails);

        // If the API key itself is rejected, stop trying other models
        if (err.response?.status === 401) {
          console.error('Groq API Key invalid or expired. Check GROQ_API_KEY in Render environment variables.');
          break;
        }
      }
    }
  }

  // 2. OpenAI GPT Parser — used if Groq is unavailable
  if (apiKey) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText }
        ],
        temperature: 0.1
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
      });

      const rawContent = response.data.choices[0]?.message?.content;
      if (rawContent) {
        const parsed = extractJsonFromText(rawContent);
        if (parsed) {
          console.log('OpenAI GPT parsed successfully.');
          return sanitizeParsedResult(parsed, cleanText);
        }
      }
    } catch (err) {
      console.error('OpenAI GPT expense parsing error:', err.response?.data || err.message);
    }
  }

  // 3. Rule-Based Fallback — always works, no external API needed
  console.log('Using rule-based fallback parser.');
  return fallbackRuleBasedParser(cleanText);
}

/**
 * Extracts a JSON object from a string, even if the model wraps it in markdown or extra text.
 * Returns null if no valid JSON object is found.
 */
function extractJsonFromText(text) {
  if (!text) return null;

  // Try direct parse first (in case it's clean JSON)
  try {
    const direct = JSON.parse(text.trim());
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
      return direct;
    }
  } catch (_) {}

  // Try extracting JSON from inside markdown code blocks or surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Ensures parsed data has valid types, amounts, and category values.
 * Falls back to extracting values from original text when AI returns empty fields.
 */
function sanitizeParsedResult(parsed, originalText) {
  return {
    type: ['expense', 'income', 'transfer'].includes(parsed.type?.toLowerCase())
      ? parsed.type.toLowerCase()
      : 'expense',
    amount: typeof parsed.amount === 'number' && !isNaN(parsed.amount) && parsed.amount > 0
      ? Math.abs(parsed.amount)
      : parseAmountFromText(originalText),
    category: parsed.category || detectCategoryFromText(originalText),
    subcategory: parsed.subcategory || null,
    date: parsed.date || 'today',
    description: parsed.description || originalText,
    payment_method: parsed.payment_method || null
  };
}

/**
 * Returns a default empty expense object.
 */
function buildDefault(text) {
  return {
    type: 'expense',
    amount: 0,
    category: 'Other',
    subcategory: null,
    date: 'today',
    description: text,
    payment_method: null
  };
}

/**
 * Extracts a numeric amount from text using regex.
 */
function parseAmountFromText(text) {
  const match = text.match(/(\d+[\d,]*(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return 0;
}

/**
 * Detects the expense category using keyword matching.
 */
function detectCategoryFromText(text) {
  const t = text.toLowerCase();
  if (t.includes('petrol') || t.includes('diesel') || t.includes('auto') || t.includes('uber') || t.includes('bus') || t.includes('train') || t.includes('ola')) return 'Transport';
  if (t.includes('food') || t.includes('lunch') || t.includes('dinner') || t.includes('breakfast') || t.includes('tea') || t.includes('coffee') || t.includes('hotel') || t.includes('swiggy') || t.includes('zomato')) return 'Food';
  if (t.includes('rent') || t.includes('room')) return 'Rent';
  if (t.includes('recharge') || t.includes('current') || t.includes('eb') || t.includes('bill') || t.includes('wifi') || t.includes('internet') || t.includes('electricity')) return 'Bills';
  if (t.includes('salary') || t.includes('income')) return 'Salary';
  if (t.includes('medicine') || t.includes('hospital') || t.includes('doctor')) return 'Healthcare';
  if (t.includes('school') || t.includes('college') || t.includes('fees')) return 'Education';
  if (t.includes('shopping') || t.includes('clothes') || t.includes('amazon') || t.includes('flipkart')) return 'Shopping';
  return 'Other';
}

/**
 * Pure rule-based fallback parser — works with no external API.
 * Used when all AI parsers fail or are unavailable.
 */
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
