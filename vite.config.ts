import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { feedProxyPlugin } from './server/feedProxy.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), feedProxyPlugin(env)],
    server: {
      host: true,
      port: 5173,
    },
    preview: {
      host: true,
      port: 4173,
    },
  }
})
