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
}

export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  currentStreak: number
  bestStreak: number
}