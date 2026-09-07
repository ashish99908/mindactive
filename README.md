# SmritiLoom — AI-Based Cognitive Gaming & Memory Assistance

Cognitive training games for elderly players, with caretaker monitoring and AI-powered insights.
Prototype built with React, Node.js, SQLite, and Groq AI.

## Features
- **17 playable cognitive games** with adaptive difficulty:
  Bazaar Buddy · Spot the Change · Word Garden · Find My Way Home · Recipe Helper · Story & Remember ·
  Route Planner · Haat Budget · Voice Wall · Festival Match · Recipe Sequence · Landmark Jigsaw ·
  Soundboard · Memory Match · Sriti-Smriti Recall · Melody Tap · Calm Waves
- Patient and caretaker roles.
- Real-time score tracking and analytics, with medical report upload (PDF/image) per patient.
- AI-powered performance insights using Groq (covers all 17 games and their cognitive areas).
- Offline-tolerant result saving (localStorage queue with automatic sync).
- Audio support via Speech Synthesis.
- **Voice Wall and Soundboard support English, हिन्दी (Hindi) and অসমীয়া (Assamese)** — switch language
  inside the game at any time.

## Installation

### 1. Requirements
- Node.js 18 or newer — check with `node -v`

### 2. Backend
```bash
cd backend
npm install
```

Create a file named `.env` inside the `backend` folder with this content:

```
JWT_SECRET=change-me-to-any-long-random-string
GROQ_API_KEY=your_groq_api_key_here
```

- `JWT_SECRET` — any long random text. Required for logins to work.
- `GROQ_API_KEY` — free key from https://console.groq.com (needed only for the AI Analysis page;
  games work without it).

Then seed the database and start the server:
```bash
npm run seed
npm run dev
```
Server runs on http://localhost:5000

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app
http://localhost:3000 — register a Patient and a Caretaker account from the UI and play.

## Tech Stack
- Frontend: React, Vite, React Router, Recharts
- Backend: Node.js, Express, SQLite
- AI: Groq API
