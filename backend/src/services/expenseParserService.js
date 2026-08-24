const axios = require('axios');

/**
 * Natural Language Expense Parser Service
 * Supports Groq LLaMA 3 (free), OpenAI GPT, and Rule-based parser.
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
  const groqKey = process.env.GROQ_API_KEY;
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

  // 1. Groq AI Parser (Free & Ultra Fast)
  if (groqKey) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanText }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      }, {
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' }
      });

      const parsed = JSON.parse(response.data.choices[0].message.content);
      return normalizeParsedOutput(parsed, cleanText);
    } catch (err) {
      console.error('Groq AI expense parsing error:', err.response?.data || err.message);
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

      const parsed = JSON.parse(response.data.choices[0].message.content);
      return normalizeParsedOutput(parsed, cleanText);
    } catch (err) {
      console.error('OpenAI API expense parsing error:', err.response?.data || err.message);
    }
  }

  // 3. Rule-based NLP fallback engine for English, Tamil & Tanglish
  return ruleBasedParser(cleanText);
}

function ruleBasedParser(text) {
  const lower = text.toLowerCase();
  
  let type = 'expense';
  if (/\b(income|salary|credited|received|got paid|earned|சம்பளம்|வந்தது|வந்திருச்சு)\b/i.test(text)) {
    type = 'income';
  } else if (/\b(transfer|transferred|sent to|moved to)\b/i.test(text)) {
    type = 'transfer';
  }

  let amount = 0;
  const amountMatch = text.match(/(?:₹|rs\.?|rupees|inr)?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:rupees|rs\.?|inr|k)?/i);
  if (amountMatch) {
    let numStr = amountMatch[1].replace(/,/g, '');
    let num = parseFloat(numStr);
    if (!isNaN(num)) {
      if (amountMatch[0].toLowerCase().includes('k')) {
        num = num * 1000;
      }
      amount = num;
    }
  }

  let date = 'today';
  if (/\b(nethu|yesterday|நேற்று)\b/i.test(lower)) {
    date = 'yesterday';
  }

  let payment_method = null;
  if (/\b(upi|gpay|phonepe|paytm|g-pay)\b/i.test(lower)) {
    payment_method = 'UPI';
  } else if (/\b(cash|cash-a|பணம்)\b/i.test(lower)) {
    payment_method = 'Cash';
  } else if (/\b(credit card|card)\b/i.test(lower)) {
    payment_method = 'Credit Card';
  } else if (/\b(sbi|hdfc|icici|bank|net banking)\b/i.test(lower)) {
    payment_method = 'Bank';
  }

  let category = type === 'income' ? 'Salary' : 'Other';
  let subcategory = null;
  let description = 'Transaction';

  if (/\b(petrol|diesel|fuel|bike|car|cab|auto|bus|train|taxi|uber|ola)\b/i.test(lower)) {
    category = 'Transport';
    if (lower.includes('petrol')) subcategory = 'Petrol';
    else if (lower.includes('diesel')) subcategory = 'Diesel';
    else if (lower.includes('bus')) subcategory = 'Bus';
    else if (lower.includes('train')) subcategory = 'Train';
    else if (lower.includes('taxi') || lower.includes('cab') || lower.includes('uber') || lower.includes('ola')) subcategory = 'Taxi';
    description = subcategory || 'Transport';
  } else if (/\b(lunch|dinner|breakfast|food|tea|coffee|snacks|restaurant|swiggy|zomato|hotel|groceries|dosa|biryani)\b/i.test(lower)) {
    category = 'Food';
    if (lower.includes('tea') || lower.includes('coffee') || lower.includes('snacks')) subcategory = 'Tea & Snacks';
    else if (lower.includes('lunch')) subcategory = 'Lunch';
    else if (lower.includes('dinner')) subcategory = 'Dinner';
    else if (lower.includes('breakfast')) subcategory = 'Breakfast';
    else if (lower.includes('groceries')) subcategory = 'Groceries';
    description = subcategory || 'Food';
  } else if (/\b(bill|current|electricity|eb|water|internet|wifi|recharge|mobile|gas)\b/i.test(lower)) {
    category = 'Bills';
    if (lower.includes('eb') || lower.includes('current') || lower.includes('electricity')) subcategory = 'Electricity';
    else if (lower.includes('recharge') || lower.includes('mobile')) subcategory = 'Mobile';
    else if (lower.includes('internet') || lower.includes('wifi')) subcategory = 'Internet';
    description = subcategory || 'Bills';
  } else if (/\b(dress|shirt|pants|clothes|shopping|amazon|flipkart|mall)\b/i.test(lower)) {
    category = 'Shopping';
    description = 'Shopping';
  } else if (/\b(rent|house rent|office rent|வாடகை)\b/i.test(lower)) {
    category = 'Rent';
    description = 'House Rent';
  } else if (/\b(salary|payday|stipend|சம்பளம்)\b/i.test(lower)) {
    category = 'Salary';
    type = 'income';
    description = 'Salary';
  } else if (/\b(movie|cinema|game|ott|netflix|prime)\b/i.test(lower)) {
    category = 'Entertainment';
    description = 'Entertainment';
  } else if (/\b(doctor|hospital|medicine|pharmacy|tablet)\b/i.test(lower)) {
    category = 'Healthcare';
    description = 'Healthcare';
  } else {
    const words = text.split(' ').filter(w => w.length > 2 && !/^\d+$/.test(w));
    if (words.length > 0) {
      description = words[0];
    }
  }

  return {
    type,
    amount,
    category,
    subcategory,
    date,
    description,
    payment_method
  };
}

function normalizeParsedOutput(parsed, rawText) {
  return {
    type: ['expense', 'income', 'transfer'].includes(parsed.type?.toLowerCase()) ? parsed.type.toLowerCase() : 'expense',
    amount: typeof parsed.amount === 'number' ? Math.abs(parsed.amount) : parseFloat(parsed.amount) || 0,
    category: parsed.category || 'Other',
    subcategory: parsed.subcategory || null,
    date: parsed.date || 'today',
    description: parsed.description || rawText.substring(0, 30),
    payment_method: parsed.payment_method || null
  };
}

module.exports = {
  parseExpenseText
};
