import type { Category, Difficulty, GeneratedWord } from "../types/game"

export class WordServiceError extends Error {}

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
    throw new WordServiceError("Unable to generate a word. Please try again.")
  }

  if (!response.ok) {
    throw new WordServiceError("Unable to generate a word. Please try again.")
  }

  const data = (await response.json()) as GeneratedWord

  if (!data.word || !data.hint || !/^[A-Z]+$/.test(data.word)) {
    throw new WordServiceError("Unable to generate a word. Please try again.")
  }

  return data
}