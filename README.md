# ELD Trip Planner

Full-stack app for planning trucking routes and generating FMCSA daily ELD log sheets with HOS compliance simulation.

**Stack:** Django REST API · Next.js (React) · PostgreSQL · Leaflet · OSRM · OpenStreetMap

**Live demo:** [eld-trip-planner-ochre-rho.vercel.app](https://eld-trip-planner-ochre-rho.vercel.app)

## Features

- **Inputs:** current location, pickup, dropoff, hours used in the 70-hour / 8-day cycle
- **Outputs:** turn-by-turn instructions, interactive route map with stops and rests, filled daily log sheets (duty timeline, totals, remarks, cycle recap)
- **Shareable trips:** each plan is saved and retrievable at `/trips/{uuid}`

## Quick start

**Requirements:** Node 20+, Python 3.12+, npm

```bash
npm run setup
cp frontend/.env.local.example frontend/.env.local
npm run dev
```

| Service  | URL |
| -------- | --- |
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000 |

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/health/` | Health check |
| `POST` | `/api/trip/plan/` | Plan trip, persist, return JSON |
| `GET`  | `/api/trip/{uuid}/` | Load a saved trip |

```bash
curl -X POST http://localhost:8000/api/trip/plan/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": "Green Bay, WI",
    "pickup_location": "Fond du Lac, WI",
    "dropoff_location": "Edwardsville, IL",
    "current_cycle_used": 32
  }'
```

Locations must be **City, ST** (US city-center geocoding).

## Project layout

```
eld-trip-planner/
├── backend/          # Django REST API, HOS simulator, Postgres
├── frontend/         # Next.js UI
└── package.json      # npm workspaces + dev scripts
```

## Deployment

**Frontend (Vercel)** — deploy `frontend/`, set:

```text
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

**Backend (Railway)** — deploy `backend/` with Postgres. Set `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, and `CORS_ALLOWED_ORIGINS` to your Vercel URL.

## Assessment assumptions

Property-carrying driver · 70 hrs / 8 days · no adverse conditions · fuel every 1,000 miles · 1 hour pickup and dropoff · FMCSA 11-hour drive, 14-hour window, 30-minute break, 10-hour rest
