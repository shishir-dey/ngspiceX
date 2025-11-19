/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: env.VITE_BASE_URL || '/',
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    build: {
      // Ensure all files in public directory are copied to the build output
      copyPublicDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            plotly: ['plotly.js-dist-min'],
            vendor: ['react', 'react-dom'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    // Make sure WASM files are served with correct MIME type
    assetsInclude: ['**/*.wasm'],
  };
})
