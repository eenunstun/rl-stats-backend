import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api/* is proxied to the Express backend so we can use relative
// paths in fetch() and avoid CORS. We deliberately avoid port 5000 because
// macOS AirPlay Receiver squats on it and returns 403 to everything.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
