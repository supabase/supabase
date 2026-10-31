import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'prompt-to-prod-debug-supabase-stack-sentry',
  metadata: {
    title: 'Prompt to Prod: Debug Your Full Supabase Stack with Sentry',
    description:
      "Supabase ships your backend fast. Sentry makes sure you know what it's doing in production. Join us live on April 30.",
  },
  hero: {
    subtitle: 'Live Webinar · April 30, 2026 · 10am PT',
    title: 'Prompt to Prod: Debug Your Full Supabase Stack with Sentry',
    description:
      "Supabase ships your backend fast. Sentry makes sure you know what it's doing in production. In this live session, we'll instrument a Supabase app end-to-end. When something breaks, you'll trace it to the exact layer: an edge function, a slow query, or auth.",
    ctas: [
      {
        label: 'Register now',
        href: 'https://sentry.io/resources/sentry-supabase-workshop/',
        variant: 'primary',
      },
      {
        label: 'Learn more about Supabase',
        href: 'https://supabase.com',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'feature-grid',
      columns: 2,
      title: "What you'll learn",
      description: 'A live walkthrough of debugging a production Supabase app with Sentry.',
      items: [
        {
          title: 'End-to-end instrumentation',
          description:
            'Instrument a Supabase app across every layer: frontend, edge functions, database, and auth.',
        },
        {
          title: 'Trace errors to the exact layer',
          description:
            "When something breaks, trace it to the source. Edge function, slow query, or auth, you'll know where to look.",
        },
        {
          title: 'AI-powered root cause analysis',
          description: 'Get AI-driven analysis on what broke and why, not just a stack trace.',
        },
        {
          title: 'Know what to patch and why',
          description: 'Walk away with a clear fix, not just an alert that something went wrong.',
        },
      ],
    },
  ],
}

export default page
