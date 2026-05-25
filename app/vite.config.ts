import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages はサブパス配信なので build 時のみ base を切り替える
  base: command === 'build' ? '/genshin-util/' : '/',
  plugins: [react()],
}))
