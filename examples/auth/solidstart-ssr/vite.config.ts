import { defineConfig } from '@solidjs/start/config'

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['@supabase/ssr', '@supabase/supabase-js'],
    },
  },
})
