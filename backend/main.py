import json
import re
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from backend.models.schemas import RouteRequest, RouteResponse, IntentRequest, IntentResponse, WeatherOverride
from backend.routing.optimizer import optimize_route
from backend.routing.segments import SEGMENTS
from backend.ai.gemini import call_gemini, call_gemini_vision
from backend.ai.prompts import INTENT_PROMPT, EXPLAIN_PROMPT, VISION_PROMPT

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    print("TREADMAPS backend running")
    yield
    # Shutdown

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
    total_score = round(sum(s.pop("_score") for s in segments), 2)
    route_summary = f"Route mode: {body.mode}, segments: {len(segments)}, total score: {total_score}"
    conditions = f"temperature: {default_weather['temperature']}, precipitation: {default_weather['precipitation']}, wind_speed: {default_weather['wind_speed']}"
    explanation = call_gemini(EXPLAIN_PROMPT.format(route_summary=route_summary, conditions=conditions))
    return RouteResponse(
        segments=segments,
        score=total_score,
        explanation=explanation,
        weather_summary="Live weather coming soon",
    )

@app.post("/ai/parse-intent", response_model=IntentResponse)
async def ai_parse_intent(body: IntentRequest):
    try:
        prompt = INTENT_PROMPT.replace("{user_input}", body.user_input)
        result = call_gemini(prompt)
        print("GEMINI RAW:", repr(result))
        result = result.strip()
        if "```" in result:
            result = result.split("```")[1]
            if result.startswith("json"):
                result = result[4:]
        match = re.search(r'\{.*\}', result, re.DOTALL)
        if match:
            result = match.group()
        parsed = json.loads(result)
        return IntentResponse(**parsed)
    except Exception as e:
        print("PARSE-INTENT ERROR:", e)
        return IntentResponse(fatigue=0.5, avoid_hills=False, prefer_covered=False, pace="normal")

@app.post("/ai/analyze-image")
async def ai_analyze_image(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        mime_type = file.content_type
        result = call_gemini_vision(VISION_PROMPT, image_bytes, mime_type)
        result = result.strip()
        if result.startswith("```"):
            result = "\n".join(result.splitlines()[1:-1])
        return json.loads(result)
    except Exception:
        return {"risk_score": 50, "hazard_level": "medium", "slip_probability": 50, "visibility": 70, "key_hazards": ["unable to analyze"]}

@app.get("/ai/explain")
async def ai_explain(route_summary: str, conditions: str):
    try:
        prompt = EXPLAIN_PROMPT.format(route_summary=route_summary, conditions=conditions)
        result = call_gemini(prompt)
        return {"explanation": result}
    except Exception:
        return {"explanation": "Route selected based on current conditions."}

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
