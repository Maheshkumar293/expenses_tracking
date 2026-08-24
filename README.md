# VoxExpense — Voice-First Expense Tracker (React + Vite + Express + PostgreSQL)

VoxExpense is a modern voice-first expense tracking application designed for personal, family, and friends expense tracking. Speak naturally in **Tamil, English, or Tanglish** (or type naturally) to automatically parse expenses, review parsed entries on an interactive confirmation card, and save directly to PostgreSQL.

---

## 🚀 Tech Stack

- **Frontend**: React.js + Vite, Tailwind CSS, Recharts, Lucide Icons, React Router v6, Browser MediaRecorder API.
- **Backend**: Node.js, Express.js, PostgreSQL (`pg`), JWT + Cookie Session Authentication.
- **Voice & NLP Engine**: Speech-to-Text (Whisper API integration with intelligent Tanglish/Tamil fallback) & Natural Language Expense Parser.

---

## 📁 Repository Structure

```text
Expense_Tracker/
├── frontend/                     # React.js + Vite Frontend App
│   ├── src/
│   │   ├── components/           # UI Components (Header, Sidebar, BottomNav, VoiceRecorder, ConfirmationCard, etc.)
│   │   ├── pages/                # Pages (Dashboard, Transactions, VoiceExpense, Budgets, Accounts, Analytics, Settings)
│   │   ├── layouts/              # MainLayout, AuthLayout
│   │   ├── hooks/                # useAuth, useVoiceRecorder
│   │   ├── context/              # AuthContext
│   │   ├── services/             # Axios API Services
│   │   └── index.css
│   ├── vercel.json               # Vercel SPA Routing Rewrites
│   └── package.json
│
├── backend/                      # Node.js + Express API Backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/          # Auth, Transaction, Voice, Account, Budget, Category Controllers
│   │   ├── db/                   # Database pool, schemas DDL, automatic category seeders
│   │   ├── middleware/           # Auth JWT Middleware, Multer Upload
│   │   ├── routes/               # API Routes
│   │   └── services/             # Speech-to-Text & Natural Language Expense Parser
│   └── package.json
│
├── docs/                         # Architecture & API Documentation
└── README.md
```

---

## ⚙️ Quick Start & Local Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

*Backend runs on `http://localhost:5000/api`*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

*Frontend runs on `http://localhost:5173`*

---

## 🎙️ Key Voice Pipeline Workflow

1. **Microphone Capture**: Uses browser `MediaRecorder` API.
2. **Audio Upload**: Posts audio blob to Express `/api/voice/transcribe`.
3. **Whisper Transcription**: Converts spoken audio (e.g. *"Nethu petrol-ku 600 rupees spend panniten"*) into transcript.
4. **Expense Parsing**: Extracts amount (₹600), category (Transport), subcategory (Petrol), date (Yesterday), type (Expense), description.
5. **Interactive Confirmation Screen**: User reviews and edits fields.
6. **Confirm & Save**: Creates transaction record in PostgreSQL and updates account balance dynamically.
