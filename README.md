# ⚡ JEEMockLab — Full-Stack AI-Powered CBT Assessment & Analytics SaaS

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20AI-orange?style=for-the-badge&logo=google)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-ffca28?style=for-the-badge&logo=firebase)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay-02042b?style=for-the-badge&logo=razorpay)

**An exam-accurate, production-grade Computer-Based Testing (CBT) simulator and AI analytics platform for JEE Main & competitive engineering exams.**

[Live Demo](#) · [Architecture](#system-architecture) · [Getting Started](#getting-started) · [Shift Catalog](#shift-vault--catalog)

</div>

---

## 🎯 Overview

**JEEMockLab** transforms static, raw exam question PDFs into authentic, interactive Computer-Based Tests (CBT). It faithfully replicates the National Testing Agency (NTA) exam environment—down to the exact question palettes, sectional timers, marking scheme (+4/-1 for MCQs and Numericals), and review navigation—while pairing each test with instant AI-driven analytics, rank prediction, and on-demand Socratic tutoring.

Initially prototyped as an AI Studio experimental applet, JEEMockLab has been re-architected into a full-featured SaaS application with automated shift ingestion pipelines, credit-based wallet monetization, and multi-tier database fallback.

---

## ✨ Key Features

### 🖥️ Authentic NTA CBT Exam Interface
* **Real Examination Mechanics:** Full 75-question layout with Physics, Chemistry, and Mathematics sections, Section A (Single Choice) and Section B (Numerical Value Type).
* **NTA Standard Question Palette:** Dynamic color-coded states (`Answered`, `Not Answered`, `Marked for Review`, `Answered & Marked for Review`, `Not Visited`).
* **Exam Controls:** Section navigation, question paper modal overview, instant calculator/rough-pad instructions, and auto-submit countdown timer.
* **Math & Diagram Fidelity:** Flawless rendering of complex formulas, matrices, and chemical equations using KaTeX/LaTeX and high-resolution diagrams.

### 🤖 Gemini 2.0 AI Doubt Solver & Socratic Tutor
* **Interactive AI Tutor (`QuestionAiTutor`):** Integrated into the post-test results audit and question reviews.
* **Instant Step-by-Step Solutions:** Powered by Google's latest Gemini 2.0 model via `@google/genai` SDK.
* **Multi-Tier Key Fallbacks:** Automated failover across primary, secondary, and tertiary Gemini API keys to guarantee 100% uptime without 429 rate-limit interruptions.
* **Socratic Doubt Clarification:** Pinpoint why an answer was wrong, inspect trap options, and request alternate solving shortcuts.

### 📚 Shift Vault & Official Shift Catalog
* **Pre-Loaded Official Shifts:** Pre-ingested archives of recent JEE Main shifts (2024, 2025, and 2026) with verified answer keys.
* **One-Click Test Launch:** Filter by year, session (January / April), shift timing, and difficulty rating.

### 📊 Deep Diagnostic Analytics & Rank Predictor
* **Granular Score Breakdown:** Subject-wise score progression, net accuracy percentage, and negative marking impact analysis.
* **Time Management Telemetry:** Detailed breakdown of time spent per question, helping students identify bottlenecks.
* **Rank & Percentile Predictor:** Shift-normalized percentile calculation factoring in shift difficulty and historical cutoffs.

### 💳 SaaS Monetization & Wallet System
* **Credit / Coin Architecture:** Pay-per-mock or tiered credit recharge packs.
* **Razorpay Gateway Integration:** Seamless checkout flow with signature verification and secure server webhooks.
* **Transaction Ledger:** Live coin balance, recharge history, and test attempt receipts.

### 🛠️ Ingestion & Parsing Pipeline (PDF ➡️ CBT)
* **Automated Question Segmenter:** Custom extraction scripts (`scripts/universal_ingest_shift.mjs`, `scripts/extract_question_blocks.py`) utilizing multimodal AI to dissect raw shift PDFs into structured JSON manifests with isolated diagram crops.

---

## 🏗️ System Architecture

```
jeemocklab/
├── src/
│   ├── components/
│   │   ├── CbtEngine.tsx               # Core NTA-compliant CBT test interface
│   │   ├── ShiftVault.tsx              # Shift browsing & test selector modal
│   │   ├── QuestionAiTutor.tsx         # Gemini AI step-by-step doubt solver
│   │   ├── AnalyticsDashboard.tsx      # Subject & time-management telemetry
│   │   ├── ResultsPage.tsx             # Post-test performance breakdown & review
│   │   ├── PredictorHub.tsx            # Rank & percentile prediction engine
│   │   ├── PdfUploader.tsx             # Admin drag-and-drop PDF test creator
│   │   ├── ParsedResultAudit.tsx       # Question review and audit dashboard
│   │   ├── WalletAndAuth.tsx           # Wallet balance & user authentication
│   │   ├── wallet/                     # Recharge packs & transaction ledger
│   │   └── auth/                       # Modal sign-in & profile setup
│   ├── context/
│   │   └── AuthContext.tsx             # Centralized authentication & wallet state
│   ├── data/
│   │   ├── shifts/                     # Serialized JSON question banks
│   │   ├── shiftsCatalog.ts            # Shift metadata registry (2024–2026)
│   │   └── shiftsLoader.ts             # Async lazy-loader for exam packages
│   └── types.ts                        # Unified TypeScript schemas & interfaces
│
├── server/
│   ├── database.ts                     # Dual-storage layer (SQLite + Firestore)
│   └── ...                             # Express API routes
│
├── scripts/                            # Multimodal PDF extraction & ingestion CLI
│   ├── universal_ingest_shift.mjs
│   ├── extract_question_blocks.py
│   └── batch_ingest_all_2025.mjs
│
├── server.ts                           # Node.js / Express backend entry point
├── package.json                        # Monorepo dependencies and scripts
└── vite.config.ts                      # Vite build configuration with Tailwind v4
```

---

## 🛠️ Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Bundler & Tooling** | [Vite 6](https://vitejs.dev/), [esbuild](https://esbuild.github.io/), [tsx](https://github.com/privatenumber/tsx) |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/) |
| **AI & LLM Services** | [Google GenAI SDK](https://github.com/googleapis/genai-js) (`@google/genai` — Gemini 2.0 Flash) |
| **Backend & API** | [Node.js](https://nodejs.org/), [Express 4](https://expressjs.com/) |
| **Database & Persistence** | [Cloud Firestore](https://firebase.google.com/docs/firestore) (Firebase Admin), [SQLite](https://www.sqlite.org/) fallback |
| **Authentication** | [Firebase Authentication](https://firebase.google.com/docs/auth) |
| **Payment Gateway** | [Razorpay](https://razorpay.com/) Node SDK & Client Checkout |
| **Document Processing** | `pdf-lib`, `jspdf`, custom Python PyMuPDF pipelines |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **pnpm**
* (Optional) **Python 3.10+** (if running PDF ingestion pipelines)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ysh1318/jeemocklab.git
cd jeemocklab
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```

Key environment variables:
```ini
# Google Gemini AI API Key (Required for AI Tutor & PDF parsing)
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_API_KEY_SECONDARY=""
GEMINI_API_KEY_TERTIARY=""

# Firebase Configuration (Production persistence & Auth)
FIREBASE_PROJECT_ID="your-firebase-project-id"
GOOGLE_APPLICATION_CREDENTIALS_JSON=""

# Razorpay Payments (Optional - sandbox simulated if left blank)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch with the Vite frontend and Express API backend concurrently at `http://localhost:5173` (or your configured port).

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📜 Shift Vault & Catalog

JEEMockLab includes native support for recent official shifts:
* **2026 Session 1:** All January shift packages with complete Section A & B layouts.
* **2025 Sessions 1 & 2:** January and April shifts with high-fidelity diagrams.
* **2024 Archive:** Comprehensive past shifts for longitudinal rank comparison.

To ingest custom test papers, run:
```bash
node scripts/universal_ingest_shift.mjs --input path/to/paper.pdf --year 2026 --shift S1
```

---

## 🔒 Security & Privacy

* **Zero Plaintext Secrets:** Sensitive API keys and credentials are gated strictly server-side behind Express endpoints.
* **Signature Verification:** All Razorpay payment webhooks verify cryptographic SHA-256 HMAC signatures before minting wallet coins.
* **Sandboxed Test Integrity:** Exam submissions are verified and scored against hashed official keys with anti-tampering timestamps.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
