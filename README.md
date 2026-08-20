# 🎮 Hangman — AI-Powered Vocabulary Learning Game

A classic Hangman game reimagined with AI. Instead of picking from a fixed word list, an LLM generates a **brand new word, hint, definition, and example sentence** every single round — so every game teaches you something, not just tests your guessing luck.

🔗 **Live Demo:(https://hangman-gamma-rosy.vercel.app/)

> ⚠️ Backend is hosted on Render's free tier, so if it's been idle for a while, the first word might take 30–50 seconds to load while the server spins back up. Totally normal — just give it a moment on first load!

---


## ✨ Features

### 🧠 AI-Powered Word Engine
- Generates a **unique word + hint + definition + example sentence** every round using the Groq LLM API — no static JSON word bank doing the heavy lifting.
- Supports **3 difficulty levels** (Easy / Medium / Hard) and **12 categories** (Animals, Science, Technology, Space, History, and more), each with its own length and content rules.
- Carefully engineered system prompt that treats the model as a strict JSON generator — no reasoning leakage, no commentary, no markdown fences — with explicit `reasoning_effort` tuning to keep the reasoning model's output fast and predictable.

### ✅ Real Validation, Not Blind Trust
- Every AI response is validated on the backend before it ever reaches the player: word length, letters-only format, category match, hint doesn't leak the answer, definition is present and accurate, example sentence actually uses the word.
- If the AI returns something malformed, the backend **automatically retries** with a fresh prompt instead of showing the player broken content.
- Detailed server-side logging captures the AI's raw response and the exact validation failure reason on every attempt — makes debugging AI output issues fast instead of guessing blindly.

### 📚 Learn the Word, Not Just Guess It
- After every round (win *or* lose), a **"📖 Show Meaning"** button reveals a proper definition and example sentence — hidden by default so it doesn't spoil anything mid-round, one click away once the round ends.
- Even a loss turns into something you actually learned.

### 🛡️ Built to Not Break
- **Rate limiting** on the AI endpoint (per-IP, via Flask-Limiter) so a refresh-spammer or bot can't burn through the API quota.
- **Offline fallback word bank** — if the AI service is down, slow, or rate-limited, the game quietly falls back to a local word list instead of showing a dead error screen. The player never sees an internal error state — just a slightly simpler round.
- Handles network failures, malformed AI output, and slow responses gracefully at every layer, front and back.

### 🎨 Polished, Accessible Frontend
- Fully **keyboard-playable** — type letters directly, no mouse needed.
- Built with accessibility in mind: `aria-live` regions announce guesses and results for screen readers, proper `role` attributes throughout, visible focus states.
- Animated hangman drawing, confetti on a win (properly memoized so it doesn't glitch on re-renders), toast notifications for every guess and hint used, and a shake animation on loss.
- Fully responsive — clean from mobile to desktop.

### 📊 Progress Tracking
- Tracks games played, games won, win rate, current streak, and **best streak**, all persisted locally so your stats survive a page refresh.
- Shows your recent words so you're not tempted to repeat-guess something you just played.

---

## 🛠️ Tech Stack

**Frontend**
- React + TypeScript
- Tailwind CSS
- Vite

**Backend**
- Python + Flask
- Groq API — `openai/gpt-oss-120b` (LLM word/hint/definition generation)
- Flask-Limiter (rate limiting)
- Flask-CORS\
- 
  to  Clone the repo**
```bash
git clone <your-repo-url>
cd hangman
```

**2. Backend setup**
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
GROQ_API_KEY=your_groq_api_key_here
```
Get a free key from [console.groq.com](https://console.groq.com/keys).

Run it:
```bash
python main.py
```
Backend runs at `http://127.0.0.1:8000`.

**3. Frontend setup**

In a separate terminal, from the project root:
```bash
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` and proxies API calls to the Flask backend automatically.

---

## 🧗 Challenges I Ran Into (and fixed)

- **AI hallucinating invalid words** — the LLM would occasionally return proper nouns, words with the wrong length, or hints that basically gave away the answer. Fixed with strict prompt constraints *plus* server-side re-validation — I don't trust the AI's output, I verify it.
- **Reasoning model burning its own token budget** — switching to a reasoning-capable Groq model caused intermittent empty responses and 400 errors, because the model was spending its `max_tokens` budget on internal reasoning before ever writing the actual JSON. Fixed by explicitly setting `reasoning_effort: "low"` and raising `max_tokens`, since this task needs zero real reasoning — it's a constrained generation task, not a puzzle.
- **A toast silently overwriting another toast** — using a hint and having it show "Great guess!" instead of "Hint used," because two state updates landed in the same render cycle. Fixed by explicitly tagging which letters came from a hint versus a manual guess.
- **Confetti re-rendering on every unrelated state change** — confetti pieces were re-randomizing every time a toast fired mid-celebration, causing the animation to visibly glitch. Fixed by memoizing the piece positions so they're generated once per win, not once per render.
- **Silent AI/network failures** — early versions just showed "Unable to generate a word" and stopped there. Added retry logic, an offline word-list fallback, and proper rate limiting so the game degrades gracefully instead of dying.
- **CORS + deployment quirks** — learned the hard way about trailing slashes in environment variables breaking exact-match CORS origin checks, and about Node's IPv6/IPv4 dual-stack resolution causing flaky local dev proxy errors.

---


