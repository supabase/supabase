import { MediaBlock } from 'marketing'
import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'supabase-stripe-projects',
  metadata: {
    title: 'Stripe Projects: Provision Supabase from the Stripe CLI | Supabase',
    description:
      'One command gives you a full Supabase project with a Postgres database, Auth, Storage, Edge Functions, and Realtime. Project credentials are delivered to your environment automatically.',
  },
  hero: {
    title: 'Stripe Projects: Provision Supabase from the Stripe CLI',
    description:
      'One command gives you a full Supabase project with a Postgres database, Auth, Storage, Edge Functions, and Realtime. Project credentials are delivered to your environment automatically.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=partnerships&layout=icon-only&copy=%5B2.5x+faster%5D%0A%5BPostgres+parser%5D%0Awith+Claude+Code&icon=supabase.svg&icon2=stripe.svg',
      alt: 'Supabase and Stripe partnership',
      width: 600,
      height: 315,
    },
    ctas: [
      {
        label: 'Get started',
        href: '#get-started',
        variant: 'primary',
      },
      {
        label: 'Read the docs',
        href: 'https://supabase.com/docs',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'What is Stripe Projects?',
      description:
        'Stripe Projects is a new workflow in the Stripe CLI that provisions real services in your own provider accounts and returns working credentials to your environment. No dashboards. No manual key copying. Built for developers and AI agents.\n\nSupabase is available in the Stripe Projects catalog as a co-design launch partner.',
      children: <MediaBlock youtubeUrl="https://youtu.be/KQzDyyXn72M" />,
    },
    {
      type: 'code-block',
      id: 'get-started',
      title: 'Get a full Supabase project in minutes',
      description:
        'Install the Stripe CLI, then run these commands. A Postgres database is ready to connect, and project credentials are in your .env file.',
      code: `stripe plugin install projects
stripe projects init my-app
stripe projects add supabase/supabase:free
stripe projects env --sync`,
      language: 'bash',
      filename: 'terminal',
    },
    {
      type: 'feature-grid',
      title: "What's included",
      description: 'Every Supabase project provisioned through Stripe Projects includes:',
      columns: 3,
      items: [
        {
          title: 'Postgres database',
          description: 'Connection pooling and Row Level Security included.',
        },
        {
          title: 'Auth',
          description: 'Email, social, phone, and passwordless login.',
        },
        {
          title: 'Storage',
          description: 'Upload and serve files and media.',
        },
        {
          title: 'Edge Functions',
          description: 'Server-side logic at the edge.',
        },
        {
          title: 'Realtime',
          description: 'Live data sync across clients.',
        },
      ],
    },
    {
      type: 'faq',
      title: 'FAQs about Supabase + Stripe Projects',
      description: 'How provisioning, account ownership, and credential management work.',
      items: [
        {
          question: 'Where will my data be stored?',
          answer:
            'Resources live in your own Supabase account. You keep full access to your dashboard, connection strings, and data.',
        },
        {
          question: 'What if I already have a Supabase account?',
          answer:
            'The provisioning flow will prompt you to link your existing Supabase account instead of creating a new one.',
        },
        {
          question: 'Where do my credentials go?',
          answer:
            'Running "stripe projects env --sync" writes your project credentials to a local .env file. They are also stored in your Stripe Project so agents can access them directly.',
        },
        {
          question: 'Can AI agents use this?',
          answer:
            'Yes. Stripe Projects was designed for both humans and AI agents. The provisioning steps are deterministic and repeatable, so an agent can run the same commands you would without clicking through a browser or guessing at setup docs.',
        },
        {
          question: 'How do I open my Supabase dashboard?',
          answer:
            'Run "stripe projects open supabase" to open your Supabase dashboard directly from the CLI.',
        },
        {
          question: 'How do I rotate my credentials?',
          answer:
            'Run "stripe projects rotate supabase-supabase:free" to update the stored secrets in your Stripe Project automatically.',
        },
      ],
    },
    {
      type: 'single-column',
      title: 'Start building',
      description: 'Install the Stripe CLI and add Supabase to your project in minutes.',
      children: (
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <a
            href="https://docs.stripe.com/stripe-cli/install"
            className="text-brand hover:underline"
          >
            Stripe CLI install docs
          </a>
          <a href="https://docs.stripe.com/stripe-projects" className="text-brand hover:underline">
            Stripe Projects docs
          </a>
          <a href="https://supabase.com/docs" className="text-brand hover:underline">
            Supabase docs
          </a>
        </div>
      ),
    },
  ],
}

export default page
