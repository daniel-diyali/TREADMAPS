import os
import google.generativeai as genai


def call_gemini(prompt: str) -> str:
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return "ERROR: " + str(e)


def call_gemini_vision(prompt: str, image_bytes: bytes, mime_type: str) -> str:
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([
            prompt,
            {"inline_data": {"mime_type": mime_type, "data": image_bytes}},
        ])
        return response.text
    except Exception as e:
        return "ERROR: " + str(e)
