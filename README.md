# SmartBus

SmartBus is a prototype web app that makes **live APSRTC bus discovery** easier.
It is **not** a booking site and is **not** affiliated with or connected to APSRTC.
All bus locations, GPS positions and ticket data in this prototype are **simulated
mock data**, generated locally so you can see the filtering/ranking logic work.

## The core idea

Instead of showing every scheduled service between two stops (including buses
that already left, already passed your stop, or run in the opposite direction),
SmartBus's filtering engine only returns buses you can *actually catch right now*.

That logic lives in `backend/src/engine/filteringEngine.js` — read that file
first, it's the heart of the whole project.

## Project layout

```
smartbus/
  backend/            Node.js + Express REST API
    src/
      data/           Seed data: stops, routes, route-stop sequences, buses
      providers/      LiveBusDataProvider interface + MockBusDataProvider
      engine/         Filtering, ETA, occupancy, recommendation logic
      simulation/      Fake GPS movement loop, ticks every few seconds
      routes/         Express route handlers (REST endpoints)
      middleware/     JWT auth + role checks (user/conductor/admin)
    ai-service/       Optional Python/FastAPI microservice for ETA & crowd
                      prediction (rule-based fallback, ML-ready structure)
  frontend/           React + Vite + Tailwind + Leaflet
    src/
      pages/          Home, Search, BusDetails, Track, Favorites, College,
                      Conductor, Admin, Login, Register, Profile
      components/     BusCard, StatusBadge, SearchForm, MapView, BottomNav
      api/            Thin fetch client for the backend REST API
```

## Running it locally

You'll need Node.js 18+ (and optionally Python 3.10+ for the AI service).

```bash
# 1. Backend
cd backend
npm install
npm run dev        # starts the API on http://localhost:4000
                    # also starts the mock GPS simulation loop

# 2. Frontend (in a new terminal)
cd frontend
npm install
npm run dev         # starts the app on http://localhost:5173

# 3. (optional) AI service
cd backend/ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

The frontend talks to the backend at `http://localhost:4000/api` by default —
change `VITE_API_URL` in `frontend/.env` if you move it.

## What's real vs. what's mocked

| Feature | Status in this prototype |
|---|---|
| Stop-sequence aware filtering (direction, "already passed", "completed") | Real logic, runs on mock data |
| GPS positions | Simulated — a background loop moves each bus a little every 5s |
| ETA | Rule-based (distance ÷ average speed), swappable for an ML model later |
| Occupancy / crowd level | Estimated from simulated ticket transactions using boarding/alighting stop sequence |
| "Can I catch this bus?" / recommendation | Rule-based scoring today; designed to be replaced by the AI service |
| Conductor ticketing | Simulated screen + endpoint, not connected to any real machine |
| Live bus data source | `MockBusDataProvider` implements a `LiveBusDataProvider` interface — swap in a real/authorized `APSRTCDataProvider` later without touching the frontend |

## Swapping in real data later

Everything downstream (filtering, ETA, occupancy, the whole frontend) only
talks to the `LiveBusDataProvider` interface in
`backend/src/providers/LiveBusDataProvider.js`. To use a real, authorized data
feed, implement a new class with the same methods (e.g. `APSRTCDataProvider`)
and swap it in `backend/server.js` — nothing else needs to change.
