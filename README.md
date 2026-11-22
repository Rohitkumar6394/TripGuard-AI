# TripGuard AI

TripGuard looks up places near a destination and the available weather forecast for the travel dates.

---

## Quick start on Windows, macOS, and Linux

Start Docker Desktop in Linux container mode, or use Docker Engine with the Compose plugin on Linux.
From the repository root, run the following command.

```sh
docker compose up --build -d
```

Open [TripGuard signup](http://localhost:5173/signup) to create an account and plan a trip.
The first start downloads the images and dependencies and needs internet access.
Live destination searches also need internet access.
Ports 5173 and 4000 must be free.
If the native app is already running, stop its frontend and API before starting Compose.

Use `docker compose logs -f` to inspect startup and `docker compose down` to stop the app.
Accounts and trips persist in a Docker volume separate from your native MongoDB database.
By default, restarting the API requires signing in again.
To retain sessions across restarts, set a private random `TOKEN_SECRET` in a `.env` file next to `compose.yaml`.

### Google Maps setup

Enable Places API (New) in a billing-enabled Google Cloud project.
Set `GOOGLE_PLACES_API_KEY` in `backend/.env` for native startup or the root `.env` for Compose.
Restrict this key to Places API (New) and your server IP where available.
Creating or refreshing a trip makes four Nearby Search requests and requests rating fields, which affect billing.
Check [Google Places pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) before enabling it.

For the interactive map inside TripGuard, enable Maps Embed API and create a separate website-restricted key for the frontend origin.
Set `VITE_GOOGLE_MAPS_EMBED_KEY` in `frontend/.env` or the Compose root `.env`.
Restart the native API and frontend, or rerun `docker compose up --build -d`.
Google Maps search links work without either key.
TripGuard stores trip inputs and the weather snapshot.
Use **Refresh destination listings** on a saved trip to retrieve current Google place details and suggested stops.

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
- Open-Meteo resolves the city and provides its forecast.
- Google Places Nearby Search looks for hotels, stores and attractions within 5 km of the city center and resorts within 25 km.
- The itinerary groups returned sights and stores into suggested days.
- Saved trips show the lookup time and can be refreshed from the Itinerary page, including trips created by the old demo generator.
- The safety chatbot provides general guidance and can fetch current weather.

Place coverage depends on the map and the provider's index.
Room availability, rates, store inventory and travel safety scores have no connected source.

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
  →  Backend resolves destination and fetches mapped places and weather
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
| **Destination listings** | Named resorts, hotels, stores and attractions with individual map links. |
| **Itinerary** | Suggested stops drawn from the destination lookup. |
| **Weather** | Available daily forecasts that overlap the trip dates. |
| **Safety Chatbot** | General travel guidance and current weather. |
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
| POST | `/api/trips/:id/refresh` | Yes | Refresh a saved trip from the providers. |

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
| `checkedAt` | Date | lookup timestamp |
| `resolvedLocation` | string | matched city, region and country |

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
| `TOKEN_SECRET` | Random per process | HMAC signing secret — change before deploying |
| `GOOGLE_PLACES_API_KEY` | empty | Server key restricted to Places API (New). |

### Frontend — `frontend/.env` (copy from `.env.example`, optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:4000` | Backend base URL |

---

## Setup & Running

See also [`SETUP_MONGODB.md`](SETUP_MONGODB.md) for details.

### Prerequisites
- Node.js 24 or 26 with npm
- MongoDB (Atlas cluster or local server)

### 1. Backend

```bash
cd "backend"
npm ci
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
npm ci
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
- Connect a booking provider for date-specific room rates and availability.
- Email delivery of the itinerary (the UI already shows an "Itinerary sent" state).
- Live government travel advisories per destination.
- Automated tests and a proper CI pipeline.