from pydantic import BaseModel


class RouteRequest(BaseModel):
    origin: str
    destination: str
    mode: str = "safe"
    user_constraints: dict = {}


class RouteResponse(BaseModel):
    segments: list
    score: float
    explanation: str
    weather_summary: str


class IntentRequest(BaseModel):
    user_input: str


class IntentResponse(BaseModel):
    fatigue: float
    avoid_hills: bool
    prefer_covered: bool
    pace: str


class WeatherOverride(BaseModel):
    temperature: float
    precipitation: float
    wind_speed: float
