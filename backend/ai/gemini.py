import os
from google import genai

def call_gemini(prompt: str) -> str:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-3.1-pro-preview",
            contents=prompt
        )
        return response.text
    except Exception as e:
        print(f"GEMINI ERROR: {e}")
        return "ERROR: " + str(e)

def call_gemini_vision(prompt: str, image_bytes: bytes, mime_type: str) -> str:
    try:
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-3.1-pro-preview",
            contents=[prompt, {"inline_data": {"mime_type": mime_type, "data": image_bytes}}]
        )
        return response.text
    except Exception as e:
        print(f"GEMINI ERROR: {e}")
        return "ERROR: " + str(e)