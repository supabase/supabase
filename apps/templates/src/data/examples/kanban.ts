import { defineExample } from '../types'

export const example = defineExample({
  slug: 'kanban',
  title: 'Kanban Board',
  tagline: 'A collaborative board where cards move live.',
  description: [
    'Drag cards between columns and see teammates do the same in real time. Visitors sign in anonymously, so the board works without an account, and anyone with the invite link can join.',
    'Cards live in a TanStack DB collection synced with Postgres: live queries, optimistic moves that roll back if row level security rejects them, and Realtime updates from other members with no subscription code. Fractional positions mean a move only updates one row.',
  ],
  category: 'productivity',
  features: ['realtime', 'database', 'auth'],
  stack: ['React', 'TanStack DB', 'Vite', 'Tailwind'],
  author: {
    name: 'Supabase',
    url: 'https://github.com/supabase',
  },
  updatedAt: '2026-11-27',
  repoUrl: 'https://github.com/supabase/supabase/tree/master/examples/templates/kanban',
  demoUrl: 'https://templates-kanban.vercel.app',
  deploy: {
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Ftemplates%2Fkanban&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY',
    steps: [
      'Create a Supabase project with `supabase projects create`. To run locally instead, `supabase start` applies the migrations and config, so skip the link, push and deploy steps.',
      'Run `supabase link` and `supabase db push` to apply the migration in `supabase/migrations`.',
      'Run `supabase config push` to turn on anonymous sign-ins from `supabase/config.toml`.',
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
