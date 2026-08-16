Hangman — AI Powered 🎮

A modern twist on the classic Hangman game I built as part of my final year project. Instead of picking words from a fixed list, the game asks an AI to generate a fresh word, a clue, and a category every time you play — so no two games are ever really the same.

Why I built it this way

The usual Hangman tutorial project just hardcodes a word array. I wanted to actually build something with a real frontend/backend split, learn how to talk to an LLM API properly (and safely — the API key never touches the browser), and end up with something that felt like an actual product instead of a coding exercise.

Features
AI-generated words, hints, and categories (Easy / Medium / Hard difficulty)
Animated hangman drawing that draws itself stroke by stroke
Full keyboard support — click or type
Limited hints per game
Win/lose stats and streak tracking (saved in the browser)
Responsive layout — works on mobile and desktop
Toast-style feedback instead of ugly alert() popups
Tech stack

Frontend: React + TypeScript + Vite + Tailwind CSS Backend: Python (Flask) — validates every AI response before it ever reaches the frontend, retries automatically if the AI returns something malformed AI provider: Groq (free tier, running Llama 3.3)

Why a separate backend at all?

Because the AI API key has to live somewhere the browser can't see it. The frontend never talks to Groq directly — it asks my Flask backend for a word, and the backend is the only thing that ever holds the actual key.