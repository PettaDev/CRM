/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Base dos assets: no GitHub Pages (PettaDev/CRM) ficam sob /CRM/; no Render
  // (Express serve o dist na raiz) o build usa VITE_BASE=/ . Em dev, sempre "/".
  base: process.env.VITE_BASE ?? (command === 'build' ? '/CRM/' : '/'),
  // Testes do FRONTEND apenas. O backend (server/) é um pacote separado com seu
  // próprio runner — não deve ser varrido por este projeto.
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
