import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    host: true, // Add this to handle network connections
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true // Enable WebSocket proxy
      }
    }
  },
  build: {
    outDir: 'dist',
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  assetsInclude: ['**/*.docx'] // Add .docx files to assets include
})
