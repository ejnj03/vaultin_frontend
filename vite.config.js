import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pinned: the AWS HttpApi CORS allowlist hardcodes this exact origin,
    // so strictPort prevents Vite silently falling back to 5181 and breaking auth.
    port: 5180,
    strictPort: true,
  },
})
