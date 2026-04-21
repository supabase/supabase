/* eslint-disable no-restricted-exports */

import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    tanstackStart({
      srcDirectory: './',
      spa: {
        enabled: true,
      },
    }),
    viteReact(),
  ],
})
