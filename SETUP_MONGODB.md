# TripGuard AI - Frontend + Backend + MongoDB Setup

## 1. Install MongoDB

### Option A - MongoDB Atlas (recommended)
1. Create a free MongoDB Atlas cluster.
2. Create a database user.
3. In **Network Access**, allow your current IP for local development.
4. Copy the Node.js connection string.
5. Put it in `backend/.env` as `MONGODB_URI`.

Example:
```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/tripguard_ai?retryWrites=true&w=majority
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
TOKEN_SECRET=use-a-long-random-secret
```

### Option B - Local MongoDB
Install MongoDB Community Server and make sure the MongoDB service is running.

Use:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/tripguard_ai
```

You can view the database with MongoDB Compass.

## 2. Backend setup

Open a terminal at the repository root with Node.js 24 or 26 and npm installed.
```bash
cd backend
npm ci
```

Copy `.env.example` to `.env` and set `MONGODB_URI` and a private `TOKEN_SECRET`.
Add `GOOGLE_PLACES_API_KEY` to enable live place listings.
See the [Google Maps setup](README.md#google-maps-setup) for key restrictions and the optional embed key.

Start:
```bash
npm run dev
```

Expected:
```text
MongoDB connected: tripguard_ai
TripGuard API running at http://localhost:4000
```

Test in browser:
```text
http://localhost:4000/api/health
```

It should return:
```json
{"ok":true,"database":"connected"}
```

## 3. Frontend setup

Open another terminal at the repository root.
```bash
cd frontend
npm ci
npm run dev
```

Frontend normally runs at:
```text
http://localhost:5173
```

If your backend URL is different, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

## 4. Verify persistence

Create an account, generate a trip, then reopen it under **Itinerary**.
MongoDB creates the users and trips collections automatically.
The saved trip includes the group budget, planning rates, available activity count and forecast snapshot.
Choose **Refresh destination listings** to retrieve venue names and the current suggested stops.
