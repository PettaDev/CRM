import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Em produção (GitHub Pages: PettaDev/CRM) os assets ficam sob /CRM/.
  // Em desenvolvimento mantemos a raiz "/" para facilitar o `npm run dev`.
  base: command === 'build' ? '/CRM/' : '/',
}))
