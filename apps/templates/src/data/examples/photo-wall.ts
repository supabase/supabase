import { defineExample } from '../types'

export const example = defineExample({
  slug: 'photo-wall',
  title: 'Photo Wall',
  tagline: 'A shared photo wall your whole family can add to.',
  description: [
    'Invite people with a link, drop in photos from any device and watch the wall fill up live. Visitors sign in anonymously, uploads go straight to Storage, and row level security keeps each wall to its members.',
    'Thumbnails come from Storage image transformations, so there is no resizing code. A nightly Cron job calls an Edge Function that clears out old photos.',
  ],
  category: 'social',
  features: ['storage', 'auth', 'database', 'realtime', 'cron', 'edge-functions'],
  stack: ['React', 'TanStack DB', 'Vite', 'Tailwind'],
  author: {
    name: 'Supabase',
    url: 'https://github.com/supabase',
  },
  updatedAt: '2026-11-27',
  repoUrl: 'https://github.com/supabase/supabase/tree/master/examples/templates/photo-wall',
  demoUrl: 'https://templates-photo-wall.vercel.app',
  deploy: {
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Ftemplates%2Fphoto-wall&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY',
    steps: [
      'Create a Supabase project with `supabase projects create`, or run `supabase start` for a local one.',
      'Run `supabase link` and `supabase db push` to create the tables, the `photos` bucket and the Cron job.',
      'Run `supabase config push` to turn on anonymous sign-ins, then `supabase functions deploy cleanup`.',
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
