import json
import os
import re
from typing import Any

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

# ============================================================
# Configuration
# ============================================================

load_dotenv()

app = Flask(__name__)

# Vite normally proxies requests to Flask in dev. In production, the
# frontend lives on a different domain, so CORS must explicitly allow it.
# Set FRONTEND_URL in your hosting dashboard once the frontend is deployed.
# Vite proxies requests to Flask in dev. In production, the frontend
# lives on a different domain, so CORS must explicitly allow it via
# FRONTEND_URL, set in Render's Environment tab.
FRONTEND_URL = os.getenv("FRONTEND_URL")

_allowed_origins: list = [re.compile(r"^http://localhost:\d+$")]
if FRONTEND_URL:
    # Compile as a regex too (not a raw string) so every item in this
    # list is the same type — avoids any ambiguity in how flask-cors
    # matches mixed string/regex origins.
    _allowed_origins.append(re.compile(f"^{re.escape(FRONTEND_URL.strip())}$"))

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": _allowed_origins
        }
    },
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

GROQ_MODEL = "openai/gpt-oss-120b"

MAX_RETRIES = 3
REQUEST_TIMEOUT = 15

MIN_WORD_LENGTH = 4
MAX_WORD_LENGTH = 12

MAX_EXCLUDED_WORDS = 20
MAX_CATEGORY_LENGTH = 40


# ============================================================
# Game Configuration
# ============================================================

DIFFICULTY_RULES: dict[str, tuple[int, int]] = {
    "easy": (4, 7),
    "medium": (6, 10),
    "hard": (8, 12),
}


ALLOWED_CATEGORIES = {
    "random",
    "animals",
    "technology",
    "science",
    "food",
    "nature",
    "sports",
    "movies",
    "countries",
    "programming",
    "space",
    "history",
}


# ============================================================
# Difficulty Guidance
# ============================================================

DIFFICULTY_GUIDANCE: dict[str, str] = {
    "easy": """
- Use very common everyday English vocabulary.
- Prefer familiar words that most teenagers and adults know.
- Prefer concrete and recognizable concepts.
- Avoid unusual spellings.
- Avoid rare vocabulary.
- The player should have a reasonable chance of guessing the word
  from the clue and common letter patterns.
""".strip(),

    "medium": """
- Use moderately challenging but recognizable English vocabulary.
- The word can be less common than everyday vocabulary.
- Prefer words that are useful for learning and vocabulary development.
- Avoid extremely rare, archaic, or highly specialized terms.
- The player should need some thought but should still feel that the
  challenge is fair.
""".strip(),

    "hard": """
- Use advanced but legitimate English vocabulary.
- Prefer intellectually challenging words that are still useful in
  general educated English.
- The word may be less common than everyday vocabulary.
- Avoid obsolete, archaic, or extremely obscure dictionary words.
- The challenge should be difficult but still fair for a vocabulary game.
""".strip(),
}


# ============================================================
# Utility Functions
# ============================================================

def normalize_word(value: str) -> str:
    return value.strip().upper()


def normalize_excluded_words(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []

    result: list[str] = []

    for value in values:
        if not isinstance(value, str):
            continue

        normalized = normalize_word(value)

        if re.fullmatch(r"[A-Z]+", normalized):
            result.append(normalized)

        if len(result) >= MAX_EXCLUDED_WORDS:
            break

    return result


def normalize_category(value: Any) -> str:
    if not isinstance(value, str):
        return "random"

    category = value.strip().lower()

    if not category:
        return "random"

    if category not in ALLOWED_CATEGORIES:
        return "random"

    return category


def normalize_difficulty(value: Any) -> str:
    if isinstance(value, str) and value.lower() in DIFFICULTY_RULES:
        return value.lower()

    return "medium"


# ============================================================
# AI Prompt
# ============================================================

def build_prompt(
    difficulty: str,
    category: str,
    excluded_words: list[str],
) -> str:
    min_length, max_length = DIFFICULTY_RULES[difficulty]

    excluded_text = (
        ", ".join(excluded_words)
        if excluded_words
        else "(none)"
    )

    if category == "random":
        category_guidance = """
- Choose an interesting educational category yourself.
- The category must naturally match the generated word.
- Prefer categories such as Animals, Science, Technology, Nature,
  Food, Sports, Space, History, Geography, Programming, or similar.
""".strip()
    else:
        category_guidance = f"""
- The word MUST strongly belong to the requested category: "{category}".
- Do not use a loosely related word.
- Do not switch to another category simply because it produces an easier word.
""".strip()

    return f"""
You are the vocabulary engine for a polished educational Hangman game.

Your task is to generate EXACTLY ONE high-quality English vocabulary
challenge for a player.

============================================================
GAME SETTINGS
============================================================

Difficulty: {difficulty}
Requested category: {category}

============================================================
WORD REQUIREMENTS
============================================================

The generated word MUST satisfy every requirement below:

- Exactly ONE word.
- Real English vocabulary.
- Between {min_length} and {max_length} letters inclusive.
- Letters A-Z only.
- No spaces.
- No hyphens.
- No apostrophes.
- No numbers.
- No punctuation.
- No accented characters.
- No abbreviations.
- No acronyms.
- No proper nouns.
- No people's names.
- No brand names.
- No place names.
- No offensive or inappropriate vocabulary.
- No obsolete vocabulary.
- No archaic vocabulary.
- No extremely obscure dictionary words.
- No unnecessarily technical terminology unless the category
  specifically requires it.
- Prefer useful educational vocabulary.
- Repeated letters are allowed.
- Do not create a word by simply modifying an excluded word.

============================================================
DIFFICULTY
============================================================

{DIFFICULTY_GUIDANCE[difficulty]}

============================================================
CATEGORY
============================================================

{category_guidance}

============================================================
DUPLICATE PREVENTION
============================================================

Recently used words:

{excluded_text}

You MUST NOT generate any word from this list.

Also avoid trivial variations of excluded words, including:
- Singular/plural variations.
- Common suffix changes.
- Minor grammatical variations.
- Words that are essentially the same vocabulary item.

============================================================
CLUE REQUIREMENTS
============================================================

Create ONE concise educational clue.

The clue MUST:

- Explain or strongly describe the concept represented by the word.
- Help the player learn the vocabulary.
- Be natural and easy to understand.
- Usually be one short sentence or phrase.
- NOT contain the answer.
- NOT spell the answer.
- NOT reveal the first letter.
- NOT reveal the number of letters.
- NOT contain the answer as an obvious substring.
- NOT directly say "This word means..."
- NOT make the answer completely obvious unless difficulty is easy.
- Match the requested difficulty.

Example:

Word:
ALGORITHM

Good clue:
"A step-by-step method used to solve a problem."

Bad clue:
"A step-by-step procedure called an algorithm."

============================================================
QUALITY CONTROL
============================================================

Before returning the result, silently verify:

1. The word is real English vocabulary.
2. The word has {min_length}-{max_length} letters.
3. The word contains only A-Z letters.
4. The word matches the requested difficulty.
5. The word strongly matches the requested category.
6. The word is not a proper noun.
7. The word is not in the excluded list.
8. The word is not a trivial variation of an excluded word.
9. The clue does not reveal the answer.
10. The clue is concise.
11. The clue is educational.
12. The content is appropriate for a general audience.

If ANY requirement fails, silently choose a different word.

============================================================
OUTPUT FORMAT
============================================================

Return ONLY one valid JSON object.

Do NOT return:
- Markdown
- Code fences
- Explanations
- Commentary
- Multiple objects
- Lists
- Text before the JSON
- Text after the JSON

The JSON MUST contain exactly these fields:

{{
    "word": "EXAMPLE",
    "hint": "Short educational clue.",
    "category": "Category Name",
    "difficulty": "{difficulty}"
}}

Rules:

- "word" contains ONLY the generated word.
- "hint" contains ONLY the clue.
- "category" contains a short human-readable category.
- "difficulty" MUST be exactly "{difficulty}".

Generate the best possible Hangman vocabulary challenge now.
""".strip()


# ============================================================
# AI Request
# ============================================================

def call_groq(prompt: str) -> dict:
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not configured.")

    response = requests.post(
        GROQ_URL,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
        },
        json={
            "model": GROQ_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a professional English vocabulary "
                        "content generator for an educational Hangman "
                        "game. Follow all constraints exactly. "
                        "Return only the requested JSON object."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "temperature": 0.7,
            "max_tokens": 300,
            "response_format": {
                "type": "json_object"
            },
        },
        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    data = response.json()

    choices = data.get("choices")

    if not isinstance(choices, list) or not choices:
        raise ValueError("Invalid AI response structure.")

    message = choices[0].get("message", {})

    if not isinstance(message, dict):
        raise ValueError("Invalid AI message.")

    content = message.get("content")

    if not isinstance(content, str) or not content.strip():
        raise ValueError("AI returned empty content.")

    content = content.strip()

    content = re.sub(
        r"^```(?:json)?\s*",
        "",
        content,
        flags=re.IGNORECASE,
    )

    content = re.sub(
        r"\s*```$",
        "",
        content,
    )

    parsed = json.loads(content)

    if not isinstance(parsed, dict):
        raise ValueError("AI response is not a JSON object.")

    return parsed


# ============================================================
# AI Response Validation
# ============================================================

def validate_generated_word(
    raw: Any,
    requested_difficulty: str,
    requested_category: str,
    excluded_words: list[str],
) -> dict | None:
    if not isinstance(raw, dict):
        return None

    word = raw.get("word")
    hint = raw.get("hint")
    category = raw.get("category")
    difficulty = raw.get("difficulty")

    if not isinstance(word, str):
        return None
    if not isinstance(hint, str):
        return None
    if not isinstance(category, str):
        return None
    if not isinstance(difficulty, str):
        return None

    if not word.strip():
        return None
    if not hint.strip():
        return None
    if not category.strip():
        return None

    normalized_word = normalize_word(word)
    normalized_difficulty = difficulty.strip().lower()

    if normalized_difficulty != requested_difficulty:
        return None

    if not re.fullmatch(r"[A-Z]+", normalized_word):
        return None

    min_length, max_length = DIFFICULTY_RULES[requested_difficulty]

    if not (min_length <= len(normalized_word) <= max_length):
        return None

    normalized_excluded = {normalize_word(value) for value in excluded_words}

    if normalized_word in normalized_excluded:
        return None

    clean_category = category.strip()

    if len(clean_category) > 50:
        return None

    if requested_category != "random":
        if not clean_category:
            return None

    clean_hint = re.sub(r"\s+", " ", hint.strip())

    if len(clean_hint) < 5:
        return None
    if len(clean_hint) > 200:
        return None

    if normalized_word.lower() in clean_hint.lower():
        return None

    return {
        "word": normalized_word,
        "hint": clean_hint,
        "category": clean_category,
        "difficulty": requested_difficulty,
    }


# ============================================================
# API Error Helper
# ============================================================

def api_error(message: str, status_code: int):
    return jsonify({"error": message}), status_code


# ============================================================
# Generate Word Endpoint
# ============================================================

@app.route("/api/generate-word", methods=["POST"])
def generate_word():
    if not GROQ_API_KEY:
        return api_error("Unable to generate a word. Please try again.", 500)

    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        body = {}

    difficulty = normalize_difficulty(body.get("difficulty"))
    category = normalize_category(body.get("category"))
    excluded_words = normalize_excluded_words(body.get("exclude"))

    prompt = build_prompt(
        difficulty=difficulty,
        category=category,
        excluded_words=excluded_words,
    )

    for attempt in range(MAX_RETRIES):
        try:
            raw_response = call_groq(prompt)

            validated = validate_generated_word(
                raw=raw_response,
                requested_difficulty=difficulty,
                requested_category=category,
                excluded_words=excluded_words,
            )

            if validated is not None:
                return jsonify(validated), 200

            prompt = build_prompt(
                difficulty=difficulty,
                category=category,
                excluded_words=excluded_words,
            )

        except (
            requests.RequestException,
            json.JSONDecodeError,
            ValueError,
            KeyError,
            TypeError,
        ):
            continue

        except Exception:
            continue

    return api_error("Unable to generate a word. Please try again.", 502)


# ============================================================
# Health Check
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ============================================================
# Application Entry Point
# ============================================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=True,
    )