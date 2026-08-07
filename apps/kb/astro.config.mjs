import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  // Served under supabase.com/kb, similar to how apps/docs runs under /docs.
  base: process.env.PUBLIC_BASE_PATH || '/kb/',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
})
