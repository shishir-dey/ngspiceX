import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
  build: {
    // Ensure all files in public directory are copied to the build output
    copyPublicDir: true,
  },
  // Make sure WASM files are served with correct MIME type
  assetsInclude: ['**/*.wasm'],
})
