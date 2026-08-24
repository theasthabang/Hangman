import React from "react"
import ReactDOM from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"
import App from "./App"
import "./index.css"

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!clerkPubKey) {
  // Not a hard crash — the game itself works fine without auth, so
  // this is a console warning, not a thrown error. Sign-in/leaderboard
  // UI just won't work until this is set.
  console.warn(
    "VITE_CLERK_PUBLISHABLE_KEY is not set. Sign-in and the leaderboard will not work until it's configured."
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey ?? ""}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
)