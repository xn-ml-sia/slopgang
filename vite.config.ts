import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { feedProxyPlugin } from './server/feedProxy.ts'

export default defineConfig({
  plugins: [react(), feedProxyPlugin()],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
