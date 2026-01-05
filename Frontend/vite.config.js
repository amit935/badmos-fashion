import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  }
}))
