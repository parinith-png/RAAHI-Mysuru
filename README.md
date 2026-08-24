# 🛡️ RAAHI

**Community-powered road safety layer for Mysuru, Karnataka**

A Progressive Web App that combines historical crash patterns, live community hazard reports, route risk analysis, cautious speed guidance, and passive voice alerts — helping people become aware of road danger before and during their journey without requiring interaction while driving.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure API keys
cp .env.example .env
# Edit .env and add your keys (see below)

# 3. Start dev server
npm run dev
```

Open https://raahi-mysuru.vercel.app/ on your phone or browser.

---

## Required API Keys

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | **Yes** | Maps, Directions, Places, Visualization |
| `VITE_FIREBASE_API_KEY` | Optional | Live community reports across devices |
| `VITE_FIREBASE_AUTH_DOMAIN` | Optional | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Optional | Firestore database |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional | Firebase Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging |
| `VITE_FIREBASE_APP_ID` | Optional | Firebase App ID |

### Google Maps APIs to Enable
1. Maps JavaScript API
2. Directions API
3. Places API

### Optional: Seed Firestore
```bash
# After adding Firebase keys to .env
npm run seed
```

---

## Features

### 🗺️ Safety Map
- Dark-styled Mysuru map with crash heatmap
- Community hazard markers with confidence indicators
- Blind spot zones with visual radii
- Compact safety legend

### 🔍 Route Planning
- Google Places search for destinations
- Multiple route comparison with risk scores
- Route risk profile visualization
- Risk explanation for each route

### 🏎️ Speed Guidance
- Verified speed limits for 7 Mysuru roads
- Cautious speed recommendations (never exceeds legal limit)
- Risk-based, weather-aware, time-aware reductions

### ⚠️ Community Reports
- Report hazards, blind spots, and near misses
- Real-time Firestore sync between devices
- Grid-cell clustering (~44m grid)
- Independent device verification with time decay

### 🛡️ Passive Drive Mode
- Minimal UI — no interaction required
- Geofenced voice alerts at blind spots
- High-risk zone audio warnings
- Alert cooldown and de-duplication
- **Demo simulation** for hackathon demonstration

### 📊 Risk Timeline
- Time-of-day risk variation chart
- Answers "WHEN is this road riskier?"

---

## Tech Stack

- **Frontend**: React 19, Vite 5, Tailwind CSS 3
- **Maps**: Google Maps JavaScript API
- **Backend**: Firebase Firestore (optional — works offline with seed data)
- **Voice**: Web Speech API (speechSynthesis)
- **GPS**: Geolocation API (watchPosition)
- **PWA**: Service Worker, Web App Manifest

---

## Project Structure

```
src/
├── config/           Firebase + Google Maps initialization
├── data/             Seed data (accidents, flags, speed limits)
├── utils/            Risk engine, speed engine, grid clustering
├── hooks/            Geolocation, Firestore listener, voice alerts
├── components/       9 React components
├── scripts/          Firestore seeding script
├── App.jsx           Main orchestration
└── main.jsx          Entry point
```

---

## Demo Mode

The app includes a built-in demo simulation:

1. Open the app → see Mysuru map with crash heatmap
2. Search any destination → see risk-scored routes
3. Click "Start Safe Journey" → enter Drive Mode
4. Click "▶ Start Demo Simulation" → simulated GPS moves along a Mysuru route
5. Voice alerts trigger automatically at blind spots

No real driving required for the demo.

---

## Disclaimer

> RoadGuard provides safety guidance, not legal instructions. Always follow posted signs, traffic laws, and road conditions.

All demo data is labeled as `source: "synthetic"` and is not real crash data.

---

*Built for Edge Mysuru Tech Habba 2026 — #SOLVE FOR A BILLION*
