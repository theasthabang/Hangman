FROM python:3.11-slim

WORKDIR /app

# Copying requirements.txt first (before the rest of the code) means
# Docker's layer cache only re-runs pip install when dependencies
# actually change — not on every single code edit. Big speedup on
# repeated builds.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --timeout 120: matches the fix discussed earlier — this backend's
# own Groq retry logic (3 retries x 15s timeout) can take up to ~45s
# worst case, which exceeds gunicorn's default 30s worker timeout and
# would otherwise get the request killed mid-flight, looking exactly
# like "the backend is down" even when it isn't.
CMD ["gunicorn", "main:app", "--bind", "0.0.0.0:8000", "--timeout", "120"]
