# TripGuard frontend

The React app uses Vite, React Router and Tailwind CSS.
Start the backend and MongoDB using the [native setup guide](../SETUP_MONGODB.md), or run the entire stack with the [Compose quick start](../README.md).

## Native development

From the repository root, run the following commands with Node.js 24 or 26 and npm.

```sh
cd frontend
npm ci
npm run dev
```

Open [TripGuard](http://localhost:5173).
Set `VITE_API_URL` in `frontend/.env` if the API runs somewhere other than `http://localhost:4000`.
The optional `VITE_GOOGLE_MAPS_EMBED_KEY` is a browser key restricted to the frontend origin and Maps Embed API.
Keep the Places server key in the backend environment.

## Routes

| Path | Purpose |
| --- | --- |
| `/`, `/signup`, `/login` | Home and account access |
| `/dashboard` | Saved trips and destination weather |
| `/plan` | Enter trip details, preview costs and save changes |
| `/itinerary` | Reopen a trip, refresh listings or adjust the party and budget |
| `/safety-chat` | General safety guidance with optional trip context |

The dashboard, planner, itineraries and chat require sign-in.
Run `npm run lint` and `npm run build` in this directory to check the frontend.
