import json
import re
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from backend.models.schemas import RouteRequest, RouteResponse, IntentRequest, IntentResponse, WeatherOverride
from backend.routing.optimizer import optimize_route
from backend.routing.segments import SEGMENTS
from backend.ai.gemini import call_gemini, call_gemini_vision
from backend.ai.prompts import INTENT_PROMPT, EXPLAIN_PROMPT, VISION_PROMPT
from backend.services.weather import get_weather, weather_to_risk
from backend.database.snowflake import execute_query

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

def resolve_destination_key(destination: str) -> str:
    d = destination.lower()
    if any(k in d for k in ["cub", "compton", "compton union"]):
        return "cub"
    if any(k in d for k in ["northside", "northside cafe", "north side"]):
        return "northside_cafe"
    return ""


@app.post("/route", response_model=RouteResponse)
async def route(body: RouteRequest):
    try:
        weather = get_weather()
        _risk = weather_to_risk(weather)
        destination_key = resolve_destination_key(body.destination)
        segments = optimize_route(SEGMENTS, weather, body.user_constraints, body.mode, destination_key)
        total_score = round(sum(s.pop("_score") for s in segments), 2)
        route_summary = f"Route mode: {body.mode}, segments: {len(segments)}, total score: {total_score}"
        conditions = f"temperature: {weather['temperature']}, precipitation: {weather['precipitation']}, wind_speed: {weather['wind_speed']}"
        explanation = call_gemini(EXPLAIN_PROMPT.format(route_summary=route_summary, conditions=conditions))
        response = RouteResponse(
            segments=segments,
            score=total_score,
            explanation=explanation,
            weather_summary=f"{weather['description']}, {weather['temperature']}°F, wind {weather['wind_speed']} mph",
        )
        try:
            execute_query(
                "INSERT INTO ROUTE_EVENTS (route_mode, score, temperature, precipitation, user_fatigue) VALUES (%s, %s, %s, %s, %s)",
                (body.mode, total_score, weather["temperature"], weather["precipitation"], body.user_constraints.get("fatigue", 0.0)),
            )
        except Exception as e:
            print("Snowflake log failed:", e)
        return response
    except Exception as e:
        print(f"Error in route: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/route"})

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
        print(f"Error in ai_parse_intent: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/ai/parse-intent"})

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
    except Exception as e:
        print(f"Error in ai_analyze_image: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/ai/analyze-image"})

@app.get("/ai/explain")
async def ai_explain(route_summary: str, conditions: str):
    try:
        prompt = EXPLAIN_PROMPT.format(route_summary=route_summary, conditions=conditions)
        result = call_gemini(prompt)
        return {"explanation": result}
    except Exception as e:
        print(f"Error in ai_explain: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/ai/explain"})

@app.get("/weather/current")
async def weather_current():
    try:
        return get_weather()
    except Exception as e:
        print(f"Error in weather_current: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/weather/current"})

@app.post("/weather/override")
async def weather_override(_body: WeatherOverride):
    try:
        return {"status": "ok", "data": None}
    except Exception as e:
        print(f"Error in weather_override: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/weather/override"})

@app.get("/analytics/dashboard")
async def analytics_dashboard():
    try:
        mode_breakdown = execute_query(
            "SELECT route_mode, COUNT(*) as count FROM ROUTE_EVENTS GROUP BY route_mode"
        )
        hourly_trend = execute_query(
            "SELECT DATE_TRUNC('hour', timestamp) as hour, ROUND(AVG(score), 3) as avg_score "
            "FROM ROUTE_EVENTS GROUP BY hour ORDER BY hour DESC LIMIT 24"
        )
        environmental_summary = execute_query(
            "SELECT ROUND(AVG(risk_score), 3) as avg_risk, ROUND(AVG(temperature), 1) as avg_temp "
            "FROM ENVIRONMENTAL_RISK WHERE timestamp > DATEADD('hour', -24, CURRENT_TIMESTAMP())"
        )
        return {"mode_breakdown": mode_breakdown, "hourly_trend": hourly_trend, "environmental_summary": environmental_summary}
    except Exception as e:
        print(f"Error in analytics_dashboard: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/analytics/dashboard"})

@app.get("/health")
async def health():
    try:
        gemini_result = call_gemini("ping")
        gemini_status = "error" if gemini_result.startswith("ERROR") else "ok"

        snowflake_result = execute_query("SELECT 1")
        snowflake_status = "error" if snowflake_result == [] else "ok"

        weather_result = get_weather()
        weather_status = "degraded" if weather_result["description"] == "unavailable" else "ok"

        services = {"gemini": gemini_status, "snowflake": snowflake_status, "weather": weather_status}
        status = "healthy" if all(v == "ok" for v in services.values()) else "degraded"
        return {"status": status, "services": services}
    except Exception as e:
        print(f"Error in health: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "endpoint": "/health"})
