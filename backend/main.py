from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.models.schemas import RouteRequest, RouteResponse, IntentRequest, IntentResponse, WeatherOverride
from backend.routing.optimizer import optimize_route
from backend.routing.segments import SEGMENTS

@asynccontextmanager
async def lifespan(_: FastAPI):
    print("TREADMAPS backend running")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/route", response_model=RouteResponse)
async def route(body: RouteRequest):
    default_weather = {"temperature": 35, "precipitation": 0, "wind_speed": 10}
    segments = optimize_route(SEGMENTS, default_weather, body.user_constraints, body.mode)
    total_score = round(sum(s["_score"] for s in segments), 2)
    return RouteResponse(
        segments=segments,
        score=total_score,
        explanation="AI explanation coming soon",
        weather_summary="Live weather coming soon",
    )

@app.post("/ai/parse-intent", response_model=IntentResponse)
async def ai_parse_intent(_body: IntentRequest):
    return {"status": "ok", "data": None}

@app.post("/ai/analyze-image")
async def ai_analyze_image():
    return {"status": "ok", "data": None}

@app.get("/ai/explain")
async def ai_explain():
    return {"status": "ok", "data": None}

@app.get("/weather/current")
async def weather_current():
    return {"status": "ok", "data": None}

@app.post("/weather/override")
async def weather_override(_body: WeatherOverride):
    return {"status": "ok", "data": None}

@app.get("/analytics/dashboard")
async def analytics_dashboard():
    return {"status": "ok", "data": None}

@app.get("/health")
async def health():
    return {"status": "ok", "data": None}
