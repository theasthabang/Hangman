export type GameStatus = "playing" | "won" | "lost"

export type Difficulty = "easy" | "medium" | "hard"

export type Category =
  | "random"
  | "animals"
  | "technology"
  | "science"
  | "food"
  | "nature"
  | "sports"
  | "movies"
  | "countries"
  | "programming"
  | "space"
  | "history"

export interface GeneratedWord {
  word: string
  hint: string
  category: string
  difficulty: Difficulty
  definition: string
  example: string
}

export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  bestStreak: number
  // Won with zero incorrect guesses. Local-only — used purely to
  // unlock the "Perfect Game" achievement badge, never sent to the
  // backend/leaderboard, so it's safe to add without touching the
  // sync payload or database schema at all.
  perfectGames: number
}