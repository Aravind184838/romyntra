import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH is injected by CI as '/<repo-name>/' for GitHub Pages.
// Falls back to '/' for local dev and the existing e2e-tests workflow.
const base = process.env.VITE_BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
