import os
import requests


def get_weather() -> dict:
    try:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": 46.7298, "lon": -117.1817, "units": "imperial", "appid": api_key}
        response = requests.get(url, params=params)
        data = response.json()
        return {
            "temperature": data["main"]["temp"],
            "wind_speed": data["wind"]["speed"],
            "precipitation": data.get("rain", {}).get("1h", 0.0),
            "description": data["weather"][0]["description"],
        }
    except Exception:
        return {"temperature": 35.0, "wind_speed": 10.0, "precipitation": 0.0, "description": "unavailable"}


def weather_to_risk(weather: dict) -> dict:
    ice_risk = 0.8 if weather["temperature"] < 32 and weather["precipitation"] > 0 else 0.1
    wind_penalty = 0.2 if weather["wind_speed"] > 20 else 0.0
    surface_risk = 0.3 if weather["precipitation"] > 5 else 0.0
    overall_modifier = (ice_risk + wind_penalty + surface_risk) / 3
    return {
        "ice_risk": ice_risk,
        "wind_penalty": wind_penalty,
        "surface_risk": surface_risk,
        "overall_modifier": overall_modifier,
    }
