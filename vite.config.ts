import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.API_URL || env.VITE_API_URL || ''
  const socketUrl = env.SOCKET_URL || env.VITE_SOCKET_URL || ''

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'API_', 'SOCKET_'],
    define: {
      'import.meta.env.API_URL': JSON.stringify(apiUrl),
      'import.meta.env.SOCKET_URL': JSON.stringify(socketUrl),
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_SOCKET_URL': JSON.stringify(socketUrl),
    },
  }
})
