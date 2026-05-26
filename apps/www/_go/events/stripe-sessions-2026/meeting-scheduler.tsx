import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'stripe/schedule',
  metadata: {
    title: 'Schedule a Meeting at Stripe Sessions 2026 | Supabase',
    description:
      'Book time with the Supabase team at Stripe Sessions 2026. Learn how Supabase and Stripe work together to help you build faster.',
  },
  hero: {
    title: 'Meet the Supabase team at Stripe Sessions',
    subtitle: 'The open-source Postgres development platform',
    description:
      'Supabase gives you a Postgres database, Auth, Storage, Edge Functions, and Realtime out of the box. Book a slot below to talk with our engineers about your project, ask questions, or see a live demo.',
    ctas: [
      {
        label: 'Book a time',
        href: '#schedule',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'hubspot-meeting',
      id: 'schedule',
      title: 'Schedule a meeting',
      description: 'Pick a time that works for you to chat with our team.',
      meetingSlug: 'chris-caruso/event-meeting-stripe-sessions',
    },
    {
      type: 'single-column',
      title: 'Build with Supabase, monetize with Stripe',
      description:
        'Supabase gives you everything you need to go from idea to production in a weekend -- a full Postgres database, authentication, file storage, edge functions, and realtime sync. When you are ready to charge for what you have built, Stripe handles payments, subscriptions, and billing. Together they let you focus on your product instead of your infrastructure.',
      children: (
        <div className="flex flex-wrap gap-4 justify-center mt-6">
          <a
            href="https://supabase.com/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-brand text-white px-5 py-2.5 text-sm font-medium hover:bg-brand/90 transition-colors"
          >
            Start building with Supabase
          </a>
          <a
            href="https://supabase.com/docs"
            className="inline-flex items-center justify-center rounded-md border border-foreground-muted text-foreground px-5 py-2.5 text-sm font-medium hover:bg-surface-200 transition-colors"
          >
            Read the documentation
          </a>
        </div>
      ),
    },
  ],
}

export default page
