/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        board: "#1c2b22",
        "board-panel": "#24362a",
        chalk: "#f2ede1",
        "chalk-dim": "#b9c2b6",
        "chalk-yellow": "#e8c468",
        "chalk-blue": "#8fb8d6",
        "chalk-red": "#d98f86",
        frame: "#5c4632",
        "frame-dark": "#40311f",
      },
      fontFamily: {
        chalk: ["Kalam", "cursive"],
      },
      keyframes: {
        draw: {
          to: { strokeDashoffset: "0" },
        },
        pop: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
        dust: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.8" },
          "100%": { transform: "translateY(14px) scale(0.4)", opacity: "0" },
        },
      },
      animation: {
        draw: "draw 0.5s ease-out forwards",
        pop: "pop 0.25s ease-out",
        shake: "shake 0.3s ease-in-out",
        dust: "dust 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
}