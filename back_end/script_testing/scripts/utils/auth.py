import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE = os.getenv("API_BASE")

EMAIL = os.getenv("EMAIL")
PASSWORD = os.getenv("PASSWORD")

def login(email: str, password: str) -> str:
    """Authenticate user and return JWT access token."""
    url = f"{API_BASE}/users/login"
    payload = {"email": email, "password": password}

    resp = requests.post(url, json=payload)
    resp.raise_for_status()

    token = resp.json().get("accessToken")
    if not token:
        raise RuntimeError("Login succeeded but no token returned")

    print(f"🔐 Logged in as {email}")
    return token

login(EMAIL, PASSWORD)