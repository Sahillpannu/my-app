# 🚛 Truckio — Australian Heavy Vehicle Navigation App

> Turn-by-turn navigation built specifically for Australian truck drivers, routed against official NHVR-approved road networks.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Resend Email Setup](#resend-email-setup)
- [Valhalla Routing Engine Setup](#valhalla-routing-engine-setup)
- [Backend Setup](#backend-setup)
- [Running on Device](#running-on-device)
- [Authentication Flow](#authentication-flow)
- [App Screens](#app-screens)
- [Data Sources](#data-sources)
- [Vehicle Classes](#vehicle-classes)
- [Architecture](#architecture)
- [Cost Breakdown](#cost-breakdown)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Legal Disclaimer](#legal-disclaimer)

---

## Overview

Truckio is a React Native navigation app for Australian heavy vehicle drivers. Unlike Google Maps or Waze, it routes trucks based on:

- The driver's **vehicle profile** — length, height, width, mass, axle configuration, vehicle class
- **NHVR-approved road networks** — which roads are legally approved, conditional, or restricted per vehicle class
- **OSM base road network** — turn restrictions, speed limits, bridge clearances

The result is legally-aware, turn-by-turn navigation that prevents drivers from being routed onto roads that are illegal or physically unsafe for their vehicle configuration.

---

## Features

### MVP (Current)
- ✅ Email + password authentication with OTP email verification
- ✅ Vehicle profile creation and management
- ✅ NHVR-aware route computation via Valhalla routing engine
- ✅ Turn-by-turn navigation with voice guidance
- ✅ Visual restriction overlay (approved / conditional / restricted segments)
- ✅ Offline map download per Australian state
- ✅ Route history

### Phase 2 (Planned)
- 🔲 Live NHVR network status sync
- 🔲 Multi-stop routing
- 🔲 Fleet dispatcher dashboard
- 🔲 Truck stop / rest area / weigh station POIs
- 🔲 Road closure push notifications

### Phase 3 (Planned)
- 🔲 PBS combination auto-suggestion
- 🔲 Fatigue management reminders (HVNL-aligned)
- 🔲 Community hazard reporting

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo bare workflow) |
| Routing | Expo Router (file-based) |
| Map rendering | MapLibre GL Native |
| State management | Zustand |
| Local storage | AsyncStorage |
| Auth + Database | Supabase (PostgreSQL) |
| Email delivery | Resend |
| Routing engine | Valhalla (self-hosted, Docker) |
| Base map data | OpenStreetMap |
| NHVR data | NHVR Spatial Open Data (ArcGIS/GeoJSON/WFS) |
| Backend API | Node.js + Express |
| Spatial database | PostGIS |
| Geocoding | Nominatim (OSM) |
| Map tiles | MapTiler |

---

## Project Structure

```
truckio/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout — auth gate
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Email + password login
│   │   ├── register.tsx          # Create account
│   │   ├── verify.tsx            # OTP email verification
│   │   └── forgot.tsx            # Password reset
│   └── (main)/
│       ├── _layout.tsx           # Tab navigator
│       ├── map.tsx               # Primary navigation screen
│       ├── routes.tsx            # Saved/recent routes
│       └── settings.tsx          # Profiles, offline maps, sync
├── src/
│   ├── lib/
│   │   └── supabase.ts           # Supabase client
│   ├── types/
│   │   ├── vehicle.ts            # VehicleProfile, VehicleClass
│   │   ├── route.ts              # ComputedRoute, TurnInstruction
│   │   └── nhvr.ts               # NHVRNetworkSegment, NHVRSyncMeta
│   ├── stores/
│   │   ├── authStore.ts          # Auth state + Supabase methods
│   │   ├── vehicleProfileStore.ts
│   │   ├── navigationStore.ts
│   │   └── offlineStore.ts
│   ├── services/
│   │   ├── routing/
│   │   │   ├── valhallaClient.ts # Valhalla HTTP client
│   │   │   └── routeParser.ts    # Parse Valhalla → app types
│   │   ├── nhvr/
│   │   │   ├── nhvrSpatialClient.ts
│   │   │   └── networkStatusCache.ts
│   │   └── location/
│   │       └── locationService.ts
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapView.tsx
│   │   │   ├── RouteLayer.tsx
│   │   │   ├── RestrictionOverlay.tsx
│   │   │   └── VehicleMarker.tsx
│   │   ├── navigation/
│   │   │   ├── TurnCard.tsx
│   │   │   ├── VoiceGuidance.tsx
│   │   │   └── SpeedPanel.tsx
│   │   ├── profile/
│   │   │   ├── ProfileCard.tsx
│   │   │   └── ProfileForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── BottomSheet.tsx
│   │       └── Toast.tsx
│   └── utils/
│       ├── geo.ts                # UUID, polyline decode, distance
│       └── formatters.ts         # Distance, duration, speed formatters
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server + cron jobs
│   │   ├── routes/
│   │   │   ├── routing.ts        # POST /api/route
│   │   │   └── networkStatus.ts  # GET /api/network-status
│   │   ├── services/
│   │   │   ├── nhvrIngestion.ts  # NHVR ArcGIS WFS sync
│   │   │   └── valhallaProxy.ts  # Valhalla proxy + enrichment
│   │   └── db/
│   │       ├── pool.ts           # PostgreSQL connection pool
│   │       └── schema.ts         # PostGIS schema
│   └── package.json
├── valhalla/
│   ├── docker-compose.yml        # Valhalla container
│   ├── valhalla.json             # Valhalla config with truck costing
│   └── valhalla_tiles/           # OSM tile graph (generated, not committed)
├── assets/
│   └── images/
│       └── truck-bg.jpeg         # Onboarding/auth background
├── .env                          # Local environment variables (not committed)
├── .env.example                  # Template
├── app.json                      # Expo config
└── tsconfig.json
```

---

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Check |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Expo CLI | Latest | `npx expo --version` |
| Git | Any | `git --version` |
| Docker Desktop | Latest | `docker --version` |
| Java JDK | 17+ | `java -version` |

For Windows users — set `JAVA_HOME` before running any Android commands:
```powershell
[System.Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-24", "Machine")
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/truckio.git
cd truckio
```

### 2. Install app dependencies

```bash
npm install
npx expo install expo-router expo-location expo-speech expo-file-system expo-sqlite
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-linking
npx expo install react-native-gesture-handler react-native-reanimated react-native-safe-area-context react-native-screens
npm install @maplibre/maplibre-react-native zustand @gorhom/bottom-sheet @turf/turf axios date-fns
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Copy environment file

```bash
cp .env.example .env
```

Fill in the values — see [Environment Variables](#environment-variables) below.

### 5. TypeScript check

```bash
npx tsc --noEmit
```

Should return zero errors.

### 6. Start the app

```bash
npx expo start
```

---

## Environment Variables

Create a `.env` file at the project root:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Valhalla routing engine (self-hosted)
EXPO_PUBLIC_VALHALLA_URL=http://localhost:8002

# Backend API
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001

# Geocoding (public Nominatim, no key needed)
EXPO_PUBLIC_NOMINATIM_URL=https://nominatim.openstreetmap.org

# Map tiles
EXPO_PUBLIC_MAPTILER_KEY=your_maptiler_key
```

Create a `backend/.env` file:

```env
DATABASE_URL=postgresql://trucknav:password@localhost:5432/trucknav
VALHALLA_URL=http://localhost:8002
NHVR_PORTAL_API_KEY=your_nhvr_api_key
NHVR_SPATIAL_BASE_URL=https://spatialopendata-nhvr.hub.arcgis.com
SYNC_CRON_SCHEDULE="0 2 * * *"
```

---

## Supabase Setup

### 1. Create project

Go to [supabase.com](https://supabase.com) → New project → choose **Oceania (Sydney)** region for lowest latency to Australian users.

### 2. Get your keys

Project Settings → API:
- Copy **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Auth

Authentication → Email:
- ✅ Enable email provider
- ✅ Confirm email (sends OTP)
- OTP expiry: `3600` seconds
- OTP length: `6` digits

Authentication → URL Configuration:
- Site URL: `exp://localhost:8081`
- Redirect URLs: `exp://localhost:8081`

### 4. Configure SMTP (Resend)

Project Settings → Auth → SMTP:
- Enable custom SMTP: ✅
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key
- Sender email: `noreply@yourdomain.com`
- Sender name: `Truckio`

### 5. Database schema

Run this in Supabase SQL Editor:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Vehicle profiles (synced from app)
CREATE TABLE vehicle_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  vehicle_class TEXT NOT NULL,
  length_metres NUMERIC NOT NULL,
  width_metres  NUMERIC NOT NULL,
  height_metres NUMERIC NOT NULL,
  gvm_tonnes    NUMERIC NOT NULL,
  gcm_tonnes    NUMERIC NOT NULL,
  axle_config   TEXT NOT NULL,
  dangerous_goods BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security — users can only access their own profiles
ALTER TABLE vehicle_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profiles"
  ON vehicle_profiles FOR ALL
  USING (auth.uid() = user_id);

-- NHVR network segments
CREATE TABLE nhvr_network_segments (
  id                TEXT PRIMARY KEY,
  geometry          GEOMETRY(LINESTRING, 4326) NOT NULL,
  status_general    TEXT NOT NULL DEFAULT 'UNKNOWN',
  status_class_1    TEXT NOT NULL DEFAULT 'UNKNOWN',
  status_class_2    TEXT NOT NULL DEFAULT 'UNKNOWN',
  status_pbs        TEXT NOT NULL DEFAULT 'UNKNOWN',
  conditions_text   TEXT,
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nhvr_geometry ON nhvr_network_segments USING GIST (geometry);

-- Sync log
CREATE TABLE sync_log (
  id            SERIAL PRIMARY KEY,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  segment_count INTEGER NOT NULL,
  status        TEXT NOT NULL,
  error_message TEXT
);
```

---

## Resend Email Setup

1. Go to [resend.com](https://resend.com) → create free account
2. Dashboard → API Keys → Create API Key → copy it
3. Paste into Supabase SMTP settings as the **password** field
4. Free tier: **3,000 emails/month** — sufficient for MVP

For production, add your own domain in Resend and update the sender email from `onboarding@resend.dev` to `noreply@yourdomain.com`.

---

## Valhalla Routing Engine Setup

Valhalla is the open-source routing engine that powers truck-aware route computation. It understands height, width, weight, and length restrictions natively.

### 1. Download Australia OSM extract

```bash
mkdir -p valhalla/valhalla_tiles
cd valhalla/valhalla_tiles

# ~1.5GB download
curl -O https://download.geofabrik.de/australia-oceania/australia-latest.osm.pbf
```

### 2. Build the tile graph

Requires **8GB+ RAM**. Takes 20–60 minutes on first run.

```bash
docker run --rm \
  -v $(pwd)/valhalla/valhalla_tiles:/custom_files \
  -v $(pwd)/valhalla/valhalla.json:/valhalla.json \
  ghcr.io/gis-ops/docker-valhalla/valhalla:latest \
  valhalla_build_tiles -c /valhalla.json /custom_files/australia-latest.osm.pbf
```

On Windows (PowerShell):
```powershell
docker run --rm `
  -v "${PWD}/valhalla/valhalla_tiles:/custom_files" `
  -v "${PWD}/valhalla/valhalla.json:/valhalla.json" `
  ghcr.io/gis-ops/docker-valhalla/valhalla:latest `
  valhalla_build_tiles -c /valhalla.json /custom_files/australia-latest.osm.pbf
```

### 3. Start Valhalla

```bash
cd valhalla
docker compose up -d
```

### 4. Verify it's running

```bash
curl http://localhost:8002/status
# Expected: {"version":"3.x.x","tileset_last_modified":...}
```

### 5. Test a truck route (Sydney → Canberra)

```bash
curl -X POST http://localhost:8002/route \
  -H 'Content-Type: application/json' \
  -d '{
    "locations": [
      {"lon": 151.2093, "lat": -33.8688},
      {"lon": 149.1300, "lat": -35.2809}
    ],
    "costing": "truck",
    "costing_options": {
      "truck": {
        "height": 4.3,
        "width": 2.5,
        "length": 25.0,
        "weight": 42.5,
        "axle_load": 10.0,
        "hazmat": false
      }
    },
    "directions_options": { "units": "kilometres", "language": "en-AU" }
  }'
```

---

## Backend Setup

### 1. Start PostgreSQL with PostGIS

```bash
docker run -d --name trucknav-pg \
  -e POSTGRES_DB=trucknav \
  -e POSTGRES_USER=trucknav \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgis/postgis:16-3.4
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your DATABASE_URL and other values
```

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Verify

```bash
curl http://localhost:3001/api/health
# Expected: {"status":"ok","valhallaReachable":true,"lastNhvrSync":"..."}
```

### 5. Trigger first NHVR data sync

```bash
curl -X POST http://localhost:3001/api/network-status/sync
```

> **Note:** Before running the NHVR sync, you must:
> 1. Register at [api-portal.nhvr.gov.au](https://api-portal.nhvr.gov.au)
> 2. Subscribe to the Spatial package
> 3. Inspect the actual GeoJSON field names from the portal
> 4. Update property mappings in `backend/src/services/nhvrIngestion.ts`

---

## Running on Device

### Expo Go (limited — no MapLibre)

```bash
npx expo start
```

Scan the QR code with Expo Go. All screens work except the real map — it shows a placeholder.

### EAS Dev Client (full native — recommended)

Required for MapLibre GL (real map rendering):

```bash
npm install -g eas-cli
eas login

# Build dev client (first time ~20 min)
eas build --profile development --platform android

# Install the APK on your device, then:
npx expo start --dev-client
```

---

## Authentication Flow

```
App launch
    │
    ▼
_layout.tsx checks Supabase session
    │
    ├── No session ──► /(auth)/login
    │                       │
    │               "Create one" link
    │                       │
    │                       ▼
    │               /(auth)/register
    │               Enter email + password
    │                       │
    │               Supabase sends OTP
    │               via Resend email
    │                       │
    │                       ▼
    │               /(auth)/verify
    │               Enter 6-digit code
    │               (auto-advance, auto-submit)
    │                       │
    │               OTP verified ✓
    │                       │
    └── Session exists ─────┘
                    │
                    ▼
            /(main)/map
```

Password reset flow:
```
/(auth)/login → "Forgot password?"
    │
    ▼
/(auth)/forgot → enter email
    │
    ▼
Supabase sends reset link via Resend
    │
    ▼
User clicks link → reset password
    │
    ▼
/(auth)/login with new password
```

---

## App Screens

### Onboarding (`app/index.tsx`)
First-time welcome screen with truck background image and entry to login/register.

### Login (`app/(auth)/login.tsx`)
- Email + password fields with validation
- Show/hide password toggle
- Inline error display with red left-border box
- "Forgot password?" link
- "Create one" link to register

### Register (`app/(auth)/register.tsx`)
- Email, password, confirm password
- Password match validation (live)
- On success → navigates to verify screen with email param

### Verify (`app/(auth)/verify.tsx`)
- 6 individual OTP digit boxes
- Auto-advance on digit entry
- Auto-submit when all 6 filled
- Backspace navigates to previous box
- Resend code button
- Success/error state feedback

### Map (`app/(main)/map.tsx`)
**IDLE state:**
- Full-screen MapLibre map (OSM tiles + NHVR overlay)
- Active vehicle profile badge (top left)
- "Where to?" search bar (bottom)
- Destination search via Nominatim geocoding
- Route preview with summary card
- Restriction warnings if route has conditional/restricted segments

**NAVIGATING state:**
- Heading-up map (auto-rotates with device heading)
- Large TurnCard (instruction + distance, readable at a glance)
- SpeedPanel (current speed + time remaining)
- Voice guidance at 1000m / 500m / 200m before turns
- Off-route detection → auto-reroute after 10s

### Routes (`app/(main)/routes.tsx`)
- Recent route history cards
- Shows distance, time, vehicle profile used
- Restriction warning badges
- Tap to reload route on map

### Settings (`app/(main)/settings.tsx`)
- Vehicle profile management (add / edit / delete / set active)
- Offline map downloads per state
- NHVR data sync status + manual sync trigger
- Sign out
- Legal disclaimer

---

## Data Sources

| Source | What it provides | Access |
|---|---|---|
| NHVR Spatial Open Data | Approved/conditional/restricted road network per vehicle class | [spatialopendata-nhvr.hub.arcgis.com](https://spatialopendata-nhvr.hub.arcgis.com) — free registration |
| NHVR Developer Portal | PBS data, asset services, route planner API | [api-portal.nhvr.gov.au](https://api-portal.nhvr.gov.au) — register + subscribe |
| OpenStreetMap | Base road network, turn restrictions, speed limits | Free, no registration |
| Nominatim | Geocoding (address → coordinates) | Free public instance, 1 req/sec limit |
| MapTiler | Map tile rendering | Free tier: 100K tiles/month |

> **Important:** Before launching commercially, confirm licensing terms for NHVR data redistribution in a paid app with `spatial@nhvr.gov.au`.

---

## Vehicle Classes

| Class | Type | Examples |
|---|---|---|
| General Access | Standard heavy vehicles | HR trucks, rigid semis |
| Class 2 — Restricted Access | B-doubles, road trains | B-doubles up to 25m, road trains up to 53.5m |
| Class 1 — Special Purpose | Oversize / over-mass | Wide loads, cranes, mining equipment |
| PBS | Performance Based Standards | Custom high-productivity combinations |

Route restriction colour coding:
- 🟢 **Green** — Approved for your vehicle class
- 🟡 **Amber** — Conditional (permit or conditions may apply)
- 🔴 **Red** — Restricted (not permitted for your vehicle class)
- ⚪ **Grey** — Unknown (no NHVR data for this segment)

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│              React Native App (Expo bare)               │
│                                                        │
│  Expo Router → screens                                 │
│  Zustand → state (auth, navigation, profiles, offline) │
│  MapLibre GL → map rendering                           │
│  AsyncStorage → local persistence                      │
│  expo-location → GPS tracking                          │
│  expo-speech → voice guidance                          │
└──────────┬──────────────────────────┬──────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌───────────────────────┐
│   Supabase       │      │   Backend (Express)    │
│                  │      │                        │
│  Auth (email+OTP)│      │  POST /api/route       │
│  PostgreSQL DB   │      │  GET  /api/network-    │
│  Row-level sec   │      │       status           │
│  Vehicle profiles│      │  POST /api/network-    │
│  Route history   │      │       status/sync      │
└──────────────────┘      └───────────┬────────────┘
                                      │
                     ┌────────────────┴──────────────┐
                     │                               │
                     ▼                               ▼
          ┌─────────────────┐            ┌──────────────────┐
          │    Valhalla     │            │  PostGIS DB      │
          │  Routing Engine │            │                  │
          │  (Docker)       │            │  nhvr_network_   │
          │                 │            │  segments        │
          │  Truck costing: │            │  (spatial index) │
          │  height/width/  │            │                  │
          │  weight/length/ │            │  vehicle_        │
          │  hazmat         │            │  profiles        │
          └─────────────────┘            └──────────────────┘
                     ▲                               ▲
                     │                               │
          ┌──────────────────┐            ┌──────────────────┐
          │  OpenStreetMap   │            │  NHVR Spatial    │
          │  Australia       │            │  Open Data       │
          │  (.osm.pbf)      │            │  (ArcGIS WFS)    │
          └──────────────────┘            └──────────────────┘
```

---

## Cost Breakdown

| Component | MVP (local) | Early traction (500 DAU) | Growth (2K+ DAU) |
|---|---|---|---|
| Valhalla server | $0 (local) | ~$120/month (EC2 t3.xlarge) | ~$250–400/month |
| MapTiler tiles | $0 (free tier) | ~$25–50/month | ~$200–500/month |
| Supabase | $0 (free tier) | $0–25/month | $25–100/month |
| Resend email | $0 (free tier) | $0 (3K/month free) | $20/month |
| Backend server | $0 (local) | ~$20–50/month (Railway) | ~$50–100/month |
| **Total** | **~$0** | **~$165–245/month** | **~$545–1,100/month** |

**Key cost levers:**
- Offline map downloads dramatically reduce MapTiler tile requests
- Self-hosting OpenMapTiles eliminates tile costs entirely at scale (~$50–100/month server)
- Valhalla RAM is the routing bottleneck — size the server correctly before launch

---

## Known Limitations

- **WA, NT, Tasmania** — The NHVR National Network Map does not cover Western Australia, Northern Territory, or Tasmania. Routes through these states show reduced-confidence NHVR overlay with an in-app warning.
- **NHVR data freshness** — Network approval status is synced daily (2am). Real-time changes are not reflected until the next sync cycle.
- **Nominatim rate limit** — The public Nominatim instance is rate-limited to 1 req/sec. Search input is debounced at 800ms. For production scale, self-host or switch to a commercial geocoder.
- **Valhalla OSM accuracy** — Not all Australian roads have complete truck restriction data in OSM. NHVR overlay provides the authoritative access status where available.
- **Not a compliance certificate** — Routing is advisory only. The driver and operator remain responsible for compliance under the Heavy Vehicle National Law (HVNL).

---

## Roadmap

### v1.0 — MVP
- [x] Email + OTP authentication
- [x] Vehicle profile setup
- [ ] MapLibre map with OSM tiles
- [ ] NHVR restriction overlay
- [ ] Valhalla truck routing
- [ ] Turn-by-turn navigation
- [ ] Voice guidance
- [ ] Offline map download
- [ ] Route history

### v1.1
- [ ] Google OAuth (one-tap sign in)
- [ ] Live NHVR network status sync
- [ ] Multi-stop routing
- [ ] Truck stop / rest area POIs

### v2.0
- [ ] Fleet dispatcher web dashboard
- [ ] Route push from dispatcher to driver
- [ ] PBS combination lookup
- [ ] Road closure notifications

### v3.0
- [ ] Community hazard reporting
- [ ] Fatigue management reminders
- [ ] Full WA / NT / TAS coverage
- [ ] Commercial fleet API

---

## Legal Disclaimer

Truckio provides routing information for guidance purposes only. Route calculations are based on NHVR network data and OpenStreetMap and may not reflect current road conditions, temporary access changes, or permit requirements.

**The driver and operator remain solely responsible for:**
- Ensuring their vehicle complies with applicable mass, dimension, and access requirements under the Heavy Vehicle National Law (HVNL)
- Obtaining any necessary permits before travel
- Verifying road access conditions before and during a trip

Truckio is not a substitute for official NHVR route planning tools or legal compliance advice.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for Australian truck drivers. Powered by NHVR open data and OpenStreetMap.*