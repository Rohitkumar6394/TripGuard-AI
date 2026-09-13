# TripGuard AI

AI-powered travel safety and planning platform. TripGuard AI generates personalized trip plans with a day-wise itinerary, budget estimation, hotel suggestions, weather insights, and risk/safety analysis — all managed from a single dashboard with an integrated safety chatbot.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Features](#features)
- [Backend API](#backend-api)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [Frontend Pages & Routing](#frontend-pages--routing)
- [Environment Variables](#environment-variables)
- [Setup & Running](#setup--running)
- [Security Notes](#security-notes)
- [Roadmap Ideas](#roadmap-ideas)

---

## Overview

TripGuard AI combines travel planning with safety analysis:

- Users sign up / log in with email + password.
- They submit a trip form (origin, destination, dates, budget, transport, travel type, people, preferences).
- The backend generates a **deterministic demo plan** containing an optimized day-wise itinerary, cost breakdown, hotel suggestions, weather insight, safety score with alerts, and emergency contact info.
- Results are saved to MongoDB and shown in the dashboard.
- A **Safety Chatbot** answers travel-safety questions in the context of the user's saved trip (emergency numbers, night travel, documents, transport, live weather).

> Note: The current trip generator uses deterministic demo logic, not a live AI/LLM provider. A real provider can be connected later without changing the MongoDB structure.

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 19, React Router 7, Vite 8, Tailwind CSS 4, Framer Motion, lucide-react |
| Backend   | Node.js (native `node:http` server, no framework), Mongoose 8 |
| Database  | MongoDB (Atlas or local)                      |
| Auth      | Custom HMAC-signed tokens (JWT-style), passwords hashed with `scrypt` |
| Weather   | Open-Meteo (geocoding + forecast), server-side proxy |

---

## Architecture

```
React Frontend (Vite, port 5173)
      │   fetch with Bearer token
      ▼
Node.js Backend (native HTTP, port 4000)
      │   Mongoose
      ▼
MongoDB  (database: tripguard_ai)
```

Trip planning flow:

```
Sign in
  →  Fill Trip Plan form
  →  POST /api/trips
  →  Backend validates input
  →  Backend generates itinerary / budget / hotels / safety data
  →  Trip saved to MongoDB
  →  Frontend renders the full plan
```

---

## Project Structure

```
TripGuard AI/
├── SETUP_MONGODB.md        # MongoDB + environment setup guide
├── README.md               # This file
├── backend/
│   ├── .env.example        # Backend environment template
│   ├── server.js           # Entire API (models, auth, routes, logic)
│   └── package.json
└── frontend/
    ├── .env.example        # VITE_API_URL template
    ├── index.html
    ├── vite.config.js
    ├── eslint.config.js
    ├── package.json
    └── src/
        ├── main.jsx            # React entry point
        ├── App.jsx             # Router + protected routes
        ├── index.css           # Global styles + theme variables
        ├── lib/
        │   └── api.js          # fetch wrapper with auth token
        ├── components/
        │   ├── Navbar.jsx      # Navigation + theme switcher + logout
        │   └── Footer.jsx
        ├── pages/
        │   ├── HomePage.jsx            # Landing page
        │   ├── AuthPage.jsx            # Login / Signup (shared)
        │   ├── SignupPage.jsx          # Renders AuthPage in signup mode
        │   ├── DashboardPage.jsx       # Trips, weather, safety links
        │   ├── PlanPage.jsx            # Trip form + full result display
        │   └── SafetyChatbotPage.jsx   # Context-aware safety chat
        ├── state/theme/                # Light / Dark / System theme
        │   ├── ThemeContext.js
        │   ├── ThemeProvider.jsx
        │   └── useTheme.js
        └── ui/
            └── AppShell.jsx            # Navbar + content + Footer layout
```

---

## Features

| Feature | Description |
|--------|-------------|
| **AI Trip Planning** | Personalized plan from destination, dates, budget, and interests. |
| **AI Itinerary** | Day-by-day itinerary with activities and travel suggestions. |
| **Budget Planner** | Estimates accommodation, food, local transport, activities, travel, and miscellaneous costs. |
| **Safety / Risk Analysis** | Safety score (±85), risk alerts, precautions, and emergency contacts. |
| **Weather** | Live forecast fetched from Open-Meteo for the destination. |
| **Safety Chatbot** | Answers safety questions using the context of a saved trip. |
| **Hotels** | Three demo hotel suggestions with ratings, prices, and Google Maps links. |
| **Dashboard** | Saved trips, stat cards, quick weather check, and quick links. |

---

## Backend API

Base URL: `http://localhost:4000`

| Method | Endpoint            | Auth | Description |
|--------|---------------------|------|-------------|
| POST   | `/api/auth/signup`  | No   | Create an account. Body: `{ name, email, password }` |
| POST   | `/api/auth/login`   | No   | Log in. Body: `{ email, password }` |
| GET    | `/api/auth/me`      | Yes  | Current authenticated user. |
| GET    | `/api/health`       | No   | Health check: `{ ok, database }`. |
| GET    | `/api/weather?location=...` | No | Live weather + 5-day forecast (Open-Meteo). |
| POST   | `/api/chat`         | Yes  | Safety question. Body: `{ message, tripId? }`. |
| POST   | `/api/trips`        | Yes  | Create a trip plan. Body: `{ origin, destination, startDate, endDate, budget, transportMode, travelType, people, preferences, fullName?, email? }`. |
| GET    | `/api/trips`        | Yes  | List user's trips (newest first). |
| GET    | `/api/trips/:id`    | Yes  | Get one of the user's trips. |

Validation rules:
- Origin, destination, start date, and end date are required.
- End date must be on or after the start date.
- Passwords must be at least 6 characters.

---

## Data Models

### users
| Field    | Type   | Notes |
|----------|--------|-------|
| `name`   | string | required |
| `email`  | string | required, unique, lowercased |
| `password` | string | required, scrypt hash `salt:hash` |

Auto-fields: `createdAt`, `updatedAt`.

### trips
| Field | Type | Notes |
|-------|------|-------|
| `userId` | ObjectId | ref `User`, indexed |
| `fullName`, `email` | string | snapshot for the plan |
| `origin`, `destination` | string | required |
| `startDate`, `endDate` | Date | required |
| `budget` | number | default `0` |
| `transportMode` | string | default `"Flight"` |
| `travelType` | string | default `"Solo"` |
| `people` | number | default `1` |
| `preferences` | string | default `""` |
| `itineraryId` | string | required, unique |
| `weatherInsights` | string | |
| `transportDetails` | string | |
| `hotels` | array | demo hotel cards |
| `costPredictor` | string | budget breakdown text |
| `aiRecommendations` | string | |
| `safetyScore` | number | default `85` |
| `safetyAlerts` | array | |
| `emergencyInfo` | array | e.g. Police `100`, Ambulance `108` |
| `optimizedItinerary` | array | one string per day |

Auto-fields: `createdAt`, `updatedAt`.

Collections are created automatically by Mongoose.

---

## Authentication

- Passwords are hashed with Node's `scrypt` (per-user random salt), compared with `timingSafeEqual`.
- A custom token is created: base64url JSON payload `{ sub, exp }` + HMAC-SHA256 signature using `TOKEN_SECRET`. Expiry: 7 days.
- Frontend sends the token as `Authorization: Bearer <token>`.
- The frontend stores auth state in `localStorage`:
  - `tripguard-auth-token` — the bearer token
  - `tripguard-authenticated` — `"true"` flag
  - `tripguard-user` — JSON user object

Protected routes in the frontend redirect unauthenticated users to `/login`.

---

## Frontend Pages & Routing

| Route | Page | Access |
|-------|------|--------|
| `/` | HomePage — landing with hero, features, safety & how-it-works sections | Public |
| `/login` | AuthPage — sign in | Public |
| `/signup` | SignupPage → AuthPage (signup mode) | Public |
| `/dashboard` | DashboardPage — stats, recent trips, weather, safety link | Protected |
| `/plan` | PlanPage — trip form + generated plan | Protected |
| `/safety-chat` | SafetyChatbotPage — assistant chat | Protected |
| `*` | Redirect to `/` | — |

### Theme

`ThemeProvider` supports **Light**, **Dark** (default), and **System** modes via `localStorage` key `tripguard-theme` and `data-theme` on `<html>`.

### API helper (`src/lib/api.js`)

`apiFetch(path, options)` prepends `VITE_API_URL` (default `http://localhost:4000`), attaches the auth token, and parses JSON errors.

---

## Environment Variables

### Backend — `backend/.env` (copy from `.env.example`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `4000` | API port |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS allowed origin |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/tripguard_ai` | MongoDB connection string |
| `TOKEN_SECRET` | `change-this-in-production` | HMAC signing secret — change before deploying |

### Frontend — `frontend/.env` (copy from `.env.example`, optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:4000` | Backend base URL |

---

## Setup & Running

See also [`SETUP_MONGODB.md`](SETUP_MONGODB.md) for details.

### Prerequisites
- Node.js 18+ (20+ recommended)
- MongoDB (Atlas cluster or local server)

### 1. Backend

```bash
cd "backend"
npm install
# copy .env.example to .env and set MONGODB_URI + TOKEN_SECRET
npm run dev
```

Expected output:
```
MongoDB connected: tripguard_ai
TripGuard API running at http://localhost:4000
```

Health check: open `http://localhost:4000/api/health` → `{"ok":true,"database":"connected"}`

### 2. Frontend

```bash
cd "frontend"
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Scripts

Backend:
- `npm run dev` — watch mode (`node --watch server.js`)
- `npm start` — plain start

Frontend:
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview built output
- `npm run lint` — ESLint

---

## Security Notes

- Never put `MONGODB_URI` or `TOKEN_SECRET` in the React frontend.
- Never commit `backend/.env` to the repository (a `.gitignore` is provided).
- Change `TOKEN_SECRET` before any deployment.
- Passwords use `scrypt`; tokens are signed with HMAC-SHA256 and expire after 7 days.

---

## Roadmap Ideas

- Connect a real AI/LLM provider for itinerary, budget, and recommendation generation.
- Replace demo hotel data with a booking/aggregator API.
- Email delivery of the itinerary (the UI already shows an "Itinerary sent" state).
- Live government travel advisories per destination.
- Automated tests and a proper CI pipeline.