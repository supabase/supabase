import { defineExample } from '../types'

export const example = defineExample({
  slug: 'waitlist',
  title: 'Waitlisted',
  tagline: 'A launch page with a referral waitlist that grows itself.',
  description: [
    'People join with their name and email, get a referral link, and move up the list for every friend who joins through it. Positions and a top-referrers board update live for everyone on the page.',
    'Row level security keeps every email private: the page only ever sees totals, your own position and initials. A database trigger uses Realtime Broadcast to tell every open page when the list changes.',
  ],
  category: 'saas',
  features: ['database', 'auth', 'realtime'],
  stack: ['React', 'Vite', 'Tailwind'],
  author: {
    name: 'Supabase',
    url: 'https://github.com/supabase',
  },
  updatedAt: '2026-11-27',
  repoUrl: 'https://github.com/supabase/supabase/tree/master/examples/templates/waitlist',
  demoUrl: 'https://templates-waitlist.vercel.app',
  deploy: {
    deployUrl:
      'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Ftemplates%2Fwaitlist&env=VITE_SUPABASE_URL,VITE_SUPABASE_PUBLISHABLE_KEY',
    steps: [
      'Create a Supabase project with `supabase projects create`. To run locally instead, `supabase start` applies the migrations and config, so skip the link, push and deploy steps.',
      'Run `supabase link` and `supabase db push` to create the table, ranking functions and broadcast trigger.',
      'Run `supabase config push` to turn on anonymous sign-ins.',
      'Change the name and copy in `src/config.ts`.',
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
