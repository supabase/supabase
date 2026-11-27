import { defineExample } from '../types'

export const example = defineExample({
  slug: 'yourmind',
  title: 'YourMind',
  tagline: 'Save links, notes and images, then find them by meaning.',
  description: [
    'A private place for everything you want to remember. Paste a link and an Edge Function reads its preview; write a note or drop in an image. Then search for what you mean, not what you typed.',
    'Every item is embedded with gte-small, the model built into Edge Functions, and ranked with pgvector, so there is no third-party AI key. Images live in a private bucket behind signed, resized URLs.',
  ],
  category: 'ai',
  features: ['vectors', 'edge-functions', 'storage', 'database', 'auth', 'realtime'],
  stack: ['React', 'TanStack DB', 'Vite', 'Tailwind'],
  author: {
    name: 'Supabase',
    url: 'https://github.com/supabase',
  },
  updatedAt: '2026-11-27',
  repoUrl: 'https://github.com/supabase/supabase/tree/master/examples/templates/yourmind',
  demoUrl: 'https://templates-yourmind.vercel.app',
  deploy: {
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Ftemplates%2Fyourmind&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY',
    steps: [
      'Create a Supabase project with `supabase projects create`. To run locally instead, `supabase start` applies the migrations and config, so skip the link, push and deploy steps.',
      'Run `supabase link` and `supabase db push` to create the tables, the vector index and the `minds` bucket.',
      'Run `supabase config push` to turn on anonymous sign-ins.',
      'Deploy the functions with `supabase functions deploy save-item` and `supabase functions deploy search`.',
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
