import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      host: true, // Add this to handle network connections
    },
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    assetsInclude: ['**/*.docx'], // Add .docx files to assets include
    // Make env variables available
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
