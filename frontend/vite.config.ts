import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    proxy: {
      // json-server sirve /tasks, no /api/tasks: el rewrite saca el prefijo.
      // El frontend siempre llama /api/<recurso>, asi que el dia que el
      // backend sea Express + Mongoose montado en /api basta con borrar el
      // rewrite y no cambia nada mas.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
