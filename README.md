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

### How the group budget works

The budget covers the whole party in INR.
TripGuard counts both travel dates for meals and local transport, and only the nights between them for rooms.
It rounds the room count up using the chosen occupancy.
A same-day trip needs no lodging.

Open **Planning rates and room sharing** to replace the starting allowances with your quotes.
Round-trip fares start at zero and apply once per traveler when entered.
Each scheduled stop uses one activity allowance per traveler.
The planner reserves essential costs first, then chooses distinct live destinations within the remaining allowance.
Small parties can schedule up to three stops per day, families and parties of four to seven up to two, and parties of eight or more one.
Available listings can reduce that count further.
Room capacity, ticket availability and venue prices require confirmation with the provider.

Change the budget or party size to preview the effect before saving.
On an existing itinerary, choose **Adjust trip budget and party** to edit the same trip.
Changing its route or dates starts a new trip.

### Worked example

Five travelers spending two nights share three rooms at the default occupancy of two.
At ₹2,000 per room per night, lodging costs ₹12,000.
Three days of meals at ₹500 and local travel at ₹250 per person per day bring essentials to ₹23,250 before fares.
A ₹30,000 budget leaves room for three group activities at ₹400 per person, provided three distinct stops are available.
The estimated total is ₹29,250.
A ₹15,000 budget falls short of essentials by ₹8,250 and schedules zero stops.

## Trip data and storage

Open-Meteo resolves the destination and returns the available forecast for the trip dates.
Google Places searches within 5 km for hotels, shopping and attractions, and within 25 km for resorts.
Each category can return up to eight places.
Listings can include addresses, ratings, review counts and Google Maps links.
A preference containing “shop”, “market” or “retail” prioritizes stores when choosing stops.
The planner spreads selected stops across the trip dates.

MongoDB saves the owner, route, dates, budget, party, preferences, planning rates, available activity count, resolved destination, forecast snapshot and lookup time.
Current place details and named stops come back in the create or refresh response.
Reopening a trip uses the saved count for the budget summary until the next refresh.
The safety chatbot provides general guidance and can look up current weather.

## API reference

The native API runs at `http://localhost:4000`.
Authenticated requests use an `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Check API and database status |
| POST | `/api/auth/signup`, `/api/auth/login` | Public | Register or sign in |
| GET | `/api/auth/me` | Signed in | Read the current account |
| GET | `/api/weather?location=...` | Public | Current conditions and up to five forecast days |
| POST | `/api/chat` | Signed in | Send a message with optional trip context |
| POST | `/api/trips` | Signed in | Create a plan and return current results |
| GET | `/api/trips`, `/api/trips/:id` | Owner | Read saved summaries |
| PATCH | `/api/trips/:id` | Owner | Save budget, people, rates and planning preferences |
| POST | `/api/trips/:id/refresh` | Owner | Fetch destination data again |

Create requests require origin, destination, ISO dates (`YYYY-MM-DD`) and a whole-rupee group budget.
Include `people`, `travelType`, `transportMode`, `preferences` and `rates` to customize the plan.
Send the group budget and party size when updating an existing trip.
Solo trips have one traveler, couples have two, and families and groups have at least two.

| Rate key | Default | Unit |
| --- | ---: | --- |
| `occupancy` | 2 | People per room |
| `room` | 2,000 | INR per room per night |
| `meals` | 500 | INR per person per day |
| `local` | 250 | INR per person per day |
| `activity` | 400 | INR per person per stop |
| `roundTrip` | 0 | INR per person for the return journey including both directions |

## Development

The [native setup guide](SETUP_MONGODB.md) covers MongoDB, environment files and startup without Docker.
The [frontend guide](frontend/README.md) lists routes, scripts and browser settings.

| Source | Responsibility |
| --- | --- |
| `backend/server.js` | HTTP routes, account authentication and MongoDB persistence |
| `backend/live-trip.js` | Destination lookup, Google Places categories and weather |
| `shared/planning.mjs` | Rates, room allocation, costs and itinerary selection used by both client and server |
| `frontend/src/pages/PlanPage.jsx` | Trip form, budget preview and edits |
| `frontend/src/components/TripBudget.jsx`, `TripListings.jsx` | Cost breakdown and destination results |

Run these checks from the repository root after installing frontend dependencies.

```sh
node --test shared/planning.test.mjs
npm --prefix frontend run lint
npm --prefix frontend run build
docker compose config -q
```
