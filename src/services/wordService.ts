import type { Category, Difficulty, GeneratedWord } from "../types/game"
import wordCategoriesData from "../Wordcategories.json"

export class WordServiceError extends Error {}

// ------------------------------------------------------------------
// Offline fallback word list. Used only when the AI backend is
// unreachable or returns an invalid/error response, so a slow or
// down Groq/Flask deployment doesn't make the game entirely
// unplayable. Hints here are generic since we have no AI-generated
// clue to fall back on.
// ------------------------------------------------------------------

const FALLBACK_CATEGORIES = wordCategoriesData as Record<string, string[]>

const DIFFICULTY_LENGTH_RANGE: Record<Difficulty, [number, number]> = {
  easy: [4, 7],
  medium: [6, 10],
  hard: [8, 12],
}

// Maps our in-game categories onto the (much smaller) offline word
// list's categories. Anything not listed here falls back to the
// full combined pool, since the offline list doesn't cover every
// in-game category.
const CATEGORY_TO_FALLBACK_KEY: Partial<Record<Category, string>> = {
  animals: "Animals",
  technology: "Tech",
  programming: "Tech",
  movies: "Movies",
}

type FallbackCandidate = { word: string; sourceCategory: string }

function buildFallbackPool(category: Category): FallbackCandidate[] {
  const preferredKey = CATEGORY_TO_FALLBACK_KEY[category]
  const keysToUse = preferredKey ? [preferredKey] : Object.keys(FALLBACK_CATEGORIES)

  const pool: FallbackCandidate[] = keysToUse.flatMap(key =>
    (FALLBACK_CATEGORIES[key] ?? []).map(word => ({
      word: word.toUpperCase(),
      sourceCategory: key,
    }))
  )

  // If the requested category has no offline words at all, use the
  // full combined pool rather than failing outright.
  if (pool.length > 0) return pool

  return Object.keys(FALLBACK_CATEGORIES).flatMap(key =>
    (FALLBACK_CATEGORIES[key] ?? []).map(word => ({
      word: word.toUpperCase(),
      sourceCategory: key,
    }))
  )
}

function getFallbackWord(
  difficulty: Difficulty,
  category: Category,
  excludeWords: string[]
): GeneratedWord | null {
  const [minLength, maxLength] = DIFFICULTY_LENGTH_RANGE[difficulty]
  const excluded = new Set(excludeWords.map(w => w.toUpperCase()))

  const pool = buildFallbackPool(category)

  let candidates = pool.filter(
    ({ word }) => word.length >= minLength && word.length <= maxLength && !excluded.has(word)
  )

  // Relax the difficulty length constraint before giving up — an
  // offline word at the "wrong" difficulty still beats no word.
  if (candidates.length === 0) {
    candidates = pool.filter(({ word }) => !excluded.has(word))
  }

  if (candidates.length === 0) return null

  const pick = candidates[Math.floor(Math.random() * candidates.length)]

  return {
    word: pick.word,
    hint: `A ${pick.sourceCategory.toLowerCase()} word to guess!`,
    category: pick.sourceCategory,
    difficulty,
    // No definition/example here — that content only comes from the AI.
    // The UI hides the "Show Meaning" reveal entirely when these are
    // empty, rather than showing the player anything that hints at
    // internal fallback behaviour.
    definition: "",
    example: "",
  }
}

// In dev, VITE_API_URL is unset, so this stays "" and the Vite proxy
// (vite.config.ts) forwards /api/* to Flask on localhost:8000.
// In production, set VITE_API_URL to your deployed backend's URL
// (e.g. https://your-app.onrender.com) and this switches to calling it
// directly — no proxy exists once the frontend is a static build.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? ""

export async function generateWord(
  difficulty: Difficulty,
  category: Category,
  excludeWords: string[]
): Promise<GeneratedWord> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/generate-word`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty, category, exclude: excludeWords }),
    })
  } catch {
    const fallback = getFallbackWord(difficulty, category, excludeWords)
    if (fallback) return fallback
    throw new WordServiceError("Unable to generate a word. Please try again.")
  }

  if (!response.ok) {
    const fallback = getFallbackWord(difficulty, category, excludeWords)
    if (fallback) return fallback
    throw new WordServiceError("Unable to generate a word. Please try again.")
  }

  const data = (await response.json()) as GeneratedWord

  if (!data.word || !data.hint || !data.definition || !data.example || !/^[A-Z]+$/.test(data.word)) {
    const fallback = getFallbackWord(difficulty, category, excludeWords)
    if (fallback) return fallback
    throw new WordServiceError("Unable to generate a word. Please try again.")
  }

  return data
}