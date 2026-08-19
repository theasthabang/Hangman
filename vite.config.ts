import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
  "/api": {
    // Use 127.0.0.1 explicitly, not "localhost" — Node resolves "localhost"
    // to both ::1 (IPv6) and 127.0.0.1 (IPv4) and races them. Flask only
    // binds to 127.0.0.1, so the IPv6 attempt fails and causes intermittent
    // AggregateError [ECONNREFUSED] / 502s through this proxy, especially
    // on POST requests.
    target: "http://127.0.0.1:8000",
    changeOrigin: true,
    timeout: 60000,        // 60s
    proxyTimeout: 60000,
  },
},
  },
})