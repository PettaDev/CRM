/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Em produção (GitHub Pages: PettaDev/CRM) os assets ficam sob /CRM/.
  // Em desenvolvimento mantemos a raiz "/" para facilitar o `npm run dev`.
  base: command === 'build' ? '/CRM/' : '/',
  // Testes do FRONTEND apenas. O backend (server/) é um pacote separado com seu
  // próprio runner — não deve ser varrido por este projeto.
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
