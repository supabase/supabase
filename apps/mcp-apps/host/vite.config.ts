import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { hostApi } from './server/api.ts'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

/**
 * A local MCP Apps host for end-to-end testing: chat, tool calls and views
 * rendered through the MCP Apps bridge, against a local Supabase MCP server.
 * Development only; never built or deployed.
 */
export default defineConfig({
  root: here('.'),
  plugins: [react(), tailwindcss(), hostApi(here('..'))],
  resolve: {
    alias: { 'next/link': here('../src/shims/next-link.tsx') },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  server: { port: 5180, strictPort: true },
})
