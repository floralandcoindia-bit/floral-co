import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Broad browser support so older phones and in-app browsers (e.g. Instagram) still run the site
  build: { target: ["es2019", "safari13", "chrome80", "firefox78"] },
});
