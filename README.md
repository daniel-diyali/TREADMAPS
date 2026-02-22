# TREADMAPS

Smart pedestrian routing for WSU Pullman campus — built for real weather, real risk, real terrain.

Treadmaps analyzes live weather conditions, campus path data, and user fatigue to recommend the safest and most practical walking routes between campus buildings. It can route through buildings, use elevators, and avoid icy outdoor paths — all visualized on an interactive map.

---

## Features

- **Weather-aware routing** — pulls live conditions from OpenWeather and adjusts route scores based on rain, snow, ice, and wind
- **AI route explanation** — Gemini generates a one-sentence natural language description for each recommended route
- **Road photo analysis** — upload a photo of a campus path and Gemini Vision assesses slip risk, visibility, and hazards, then reads the result aloud via TTS
- **Voice search** — speak a destination using the Web Speech API
- **Custom map paths** — routes are drawn as custom polylines, including through building interiors (Todd Hall, CUB elevator, parking garage)
- **Fatigue & preference controls** — tiredness slider and weather mode pills adjust what the optimizer prioritizes
- **Snowflake analytics** — every route request is logged for trend analysis and dashboard queries

---

## Stack

**Frontend**
- Next.js 14, TypeScript, Tailwind CSS
- Google Maps API, Places API
- Web Speech API (voice input + TTS)

**Backend**
- FastAPI, Python
- Google Gemini AI (text + vision)
- OpenWeather API
- Snowflake

---

## Team

- **Daniel Diyali** — Backend, AI, Data
- **Adriano Perez** — Frontend, Maps, UX

---

## Setup

### Backend

```bash
cd /path/to/TREADMAPS
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the root:

```
GEMINI_API_KEY=your_key
OPENWEATHER_API_KEY=your_key
SF_ACCOUNT=your_account
SF_USER=your_user
SF_PRIVATE_KEY_PATH=/path/to/rsa_key.p8
SF_DATABASE=your_db
SF_SCHEMA=your_schema
SF_WAREHOUSE=your_warehouse
```

```bash
uvicorn backend.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
