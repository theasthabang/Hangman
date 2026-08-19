"""
Standalone diagnostic script — tests ONLY whether your Groq API key
and network access work, completely bypassing Flask and Vite.

Run from the backend folder with your venv active:
    python test_groq.py
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

print("=" * 60)
if not GROQ_API_KEY:
    print("FAIL: GROQ_API_KEY is not set in your .env file at all.")
    print("Check that backend/.env exists and has a line like:")
    print("  GROQ_API_KEY=gsk_...")
    exit(1)

print(f"Key found, starts with: {GROQ_API_KEY[:12]}...")
print(f"Key length: {len(GROQ_API_KEY)} characters")
print("=" * 60)

try:
    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
        },
        json={
            "model": "openai/gpt-oss-120b",
            "messages": [{"role": "user", "content": "Say hello in one word."}],
            "max_tokens": 10,
        },
        timeout=15,
    )

    print(f"HTTP Status Code: {response.status_code}")
    print("-" * 60)

    if response.status_code == 200:
        print("SUCCESS. Your key and network access both work.")
        print(response.json())
    elif response.status_code == 401:
        print("FAIL: 401 Unauthorized.")
        print("Your GROQ_API_KEY is invalid, expired, or was revoked/rotated.")
        print("Go to https://console.groq.com/keys and check it,")
        print("or generate a new one and update backend/.env")
    elif response.status_code == 429:
        print("FAIL: 429 Rate limited.")
        print("You've hit Groq's free-tier rate limit. Wait a bit and retry.")
    else:
        print(f"FAIL: Unexpected status {response.status_code}")
        print(response.text)

except requests.exceptions.ConnectionError as e:
    print("FAIL: Could not connect to Groq's API at all.")
    print("This suggests a network/firewall/DNS issue, not a key issue.")
    print(f"Details: {e}")

except requests.exceptions.Timeout:
    print("FAIL: Request timed out after 15 seconds.")
    print("Groq's API may be slow/down, or your network is blocking it.")

except Exception as e:
    print(f"FAIL: Unexpected error type: {type(e).__name__}")
    print(f"Details: {e}")

print("=" * 60)