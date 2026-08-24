"""
Verifies Clerk-issued session tokens on protected Flask routes.

How this works, for reference:
  1. The frontend signs a user in via Clerk's UI.
  2. Clerk issues a short-lived JWT representing that session.
  3. The frontend sends that JWT as "Authorization: Bearer <token>"
     on requests that need to prove who the user is.
  4. This module verifies the JWT's signature against Clerk's public
     keys (JWKS) — no secret key needed for verification itself, since
     this is a public-key signature check, not a shared-secret one.
  5. If valid, request.user_id is set to the token's "sub" claim —
     Clerk's own trustworthy, unforgeable user ID. Routes should use
     ONLY this value for "whose data is this", never anything read
     from the request body, since a request body can be faked by
     anyone.
"""

import os
from functools import wraps

import jwt
from flask import jsonify, request
from jwt import PyJWKClient

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL", "")

# Built lazily (not at import time) so a missing/misconfigured
# CLERK_JWKS_URL doesn't crash the whole app on startup — it only
# fails when someone actually hits a protected route, with a clear
# error, which is easier to debug than a silent import-time crash.
_jwk_client: PyJWKClient | None = None


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        if not CLERK_JWKS_URL:
            raise RuntimeError(
                "CLERK_JWKS_URL is not set. Find it in the Clerk "
                "dashboard under API Keys -> Show JWT public key, "
                "or Configure -> JWT templates."
            )
        _jwk_client = PyJWKClient(CLERK_JWKS_URL)
    return _jwk_client


def require_auth(f):
    """
    Decorator for routes that need a verified, signed-in user.
    Sets request.user_id on success. Returns 401 on any failure —
    missing header, malformed token, expired token, bad signature.
    """

    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return jsonify({"error": "Missing token"}), 401

        try:
            client = _get_jwk_client()
            signing_key = client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"require": ["exp", "sub"]},
            )
        except RuntimeError as err:
            # Server misconfiguration (CLERK_JWKS_URL missing) — a 500,
            # not a 401, since this isn't the caller's fault.
            print(f"AUTH CONFIG ERROR: {err}")
            return jsonify({"error": "Auth is not configured correctly on the server"}), 500
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired, please sign in again"}), 401
        except Exception as err:
            print(f"AUTH VERIFICATION FAILED: {type(err).__name__}: {err}")
            return jsonify({"error": "Invalid or expired token"}), 401

        request.user_id = payload["sub"]
        return f(*args, **kwargs)

    return wrapper