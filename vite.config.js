import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_BASE_URL || '/',
    build: {
      // Ensure all files in public directory are copied to the build output
      copyPublicDir: true,
    },
    // Make sure WASM files are served with correct MIME type
    assetsInclude: ['**/*.wasm'],
  };
})
