import { defineExample } from '../types'

export const example = defineExample({
  slug: 'uptime-monitor',
  title: 'Uptime Monitor',
  tagline: 'Check your sites every 30 seconds and see incidents as they open.',
  description: [
    'A Cron job queues a check for every monitor on Supabase Queues, and an Edge Function worker requests each URL and records the result. Two failures in a row open an incident; the next success resolves it.',
    'Checks and incidents stream into the dashboard over Realtime through TanStack DB. A good reference for reliable background work with nothing but Postgres and Edge Functions.',
  ],
  category: 'developer-tools',
  features: ['cron', 'queues', 'edge-functions', 'database', 'realtime', 'auth'],
  stack: ['React', 'TanStack DB', 'Vite', 'Tailwind'],
  author: {
    name: 'Supabase',
    url: 'https://github.com/supabase',
  },
  updatedAt: '2026-11-27',
  repoUrl: 'https://github.com/supabase/supabase/tree/master/examples/templates/uptime-monitor',
  demoUrl: 'https://templates-uptime-monitor.vercel.app',
  deploy: {
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Ftemplates%2Fuptime-monitor&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY',
    steps: [
      'Create a Supabase project with `supabase projects create`, or run `supabase start` for a local one.',
      'Run `supabase link` and `supabase db push` to create the tables, the `uptime_checks` queue and the Cron jobs.',
      'Run `supabase config push` to turn on anonymous sign-ins, then `supabase functions deploy run-checks`.',
      'Add your project URL and secret key to Vault with `vault.create_secret`, as shown in the README.',
      'Copy `.env.example` to `.env.local` and add your project URL and publishable key.',
      'Run `npm install && npm run dev`, or deploy to Vercel with the button above.',
    ],
    env: [
      {
        name: 'VITE_SUPABASE_URL',
        description: 'Your project URL, from the Connect dialog in the dashboard.',
      },
      {
        name: 'VITE_SUPABASE_PUBLISHABLE_KEY',
        description: 'The publishable key, safe to use in the browser.',
      },
    ],
  },
  featured: true,
})
