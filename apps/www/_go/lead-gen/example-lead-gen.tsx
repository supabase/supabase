import { MediaBlock } from 'marketing'
import type { GoPageInput } from 'marketing'

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'example-ebook',
  metadata: {
    title: 'Free Ebook: Building Modern Applications with Supabase',
    description:
      'Download our comprehensive guide to building scalable applications with Supabase. Learn best practices for authentication, database design, and real-time features.',
    ogImage: '/images/landing-pages/example-ebook/og.png',
  },
  hero: {
    title: 'Building Modern Applications with Supabase',
    subtitle: 'Sample ebook landing page',
    description:
      'This is a sample lead generation page. The content below demonstrates the template layout and all available section components. Replace it with your real ebook title, description, and cover image.',
    image: {
      src: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=vertical&copy=Modern+applications&icon=supabase.svg',
      alt: 'Ebook cover: Building Modern Applications with Supabase',
      width: 400,
      height: 500,
    },
    ctas: [
      {
        label: 'Download Free Ebook',
        href: '#form',
        variant: 'primary',
      },
    ],
  },
  sections: [
    {
      type: 'single-column',
      title: 'See Supabase in action',
      description: 'Watch a quick overview of what you can build with Supabase.',
      children: <MediaBlock youtubeUrl="https://www.youtube.com/watch?v=YR30uzwWoDM" />,
    },
    {
      type: 'feature-grid',
      title: 'Developers can build faster with Supabase',
      description: 'Features that help developers move quickly and focus.',
      items: [
        {
          title: 'AI Assistant',
          description:
            'A single panel that persists across the Supabase Dashboard and maintains context across AI prompts.',
        },
        {
          title: 'MCP Server',
          description:
            'Connect your favorite AI tools such as Cursor or Claude directly with Supabase.',
        },
        {
          title: 'Auto-generated APIs',
          description:
            "Learn SQL when you're ready. In the meantime, Supabase generates automatic APIs to make coding a lot easier.",
        },
        {
          title: 'Foreign Data Wrappers',
          description:
            'Connect Supabase to Redshift, BigQuery, MySQL, and external APIs for seamless integrations.',
        },
        {
          title: 'Instant and secure deployment',
          description: 'No need to set up servers, manage DevOps, or tweak security settings.',
        },
        {
          title: 'Observability',
          description:
            'Built-in logs, query performance tools, and security insights for easy debugging.',
        },
      ],
    },
    {
      type: 'steps',
      title: 'Get started in minutes',
      description: 'Three simple steps to launch your project with Supabase.',
      items: [
        {
          title: 'Create a project',
          description:
            'Sign up for a free Supabase account and create a new project from the dashboard. Your database, auth, and storage are provisioned instantly.',
        },
        {
          title: 'Build your schema',
          description:
            'Use the Table Editor or write SQL directly to define your tables, relationships, and row-level security policies.',
        },
        {
          title: 'Connect your app',
          description:
            'Install the Supabase client library for your framework and start querying your database with auto-generated APIs.',
        },
        {
          title: 'Deploy to production',
          content: (
            <div className="mt-2 space-y-3">
              <p className="text-foreground-lighter text-sm leading-relaxed">
                Push your project live with a single click. Supabase handles scaling, backups, and
                monitoring automatically.
              </p>
              <img
                src="https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=vertical&copy=Deploy+to+production&icon=supabase.svg"
                alt="Deploy to production"
                className="rounded-lg border border-muted w-full max-w-lg"
              />
            </div>
          ),
        },
      ],
    },
    {
      type: 'code-block',
      title: 'Simple, powerful APIs',
      description: 'Interact with your database using the auto-generated client library.',
      files: [
        {
          filename: 'app/page.tsx',
          language: 'typescript',
          code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Fetch all published posts
const { data: posts } = await supabase
  .from('posts')
  .select('id, title, content, author(name)')
  .eq('published', true)
  .order('created_at', { ascending: false })`,
        },
        {
          filename: 'lib/supabase.ts',
          language: 'typescript',
          code: `import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)`,
        },
        {
          filename: 'schema.sql',
          language: 'sql',
          code: `create table posts (
  id bigint generated always as identity primary key,
  title text not null,
  content text,
  author_id bigint references authors(id),
  published boolean default false,
  created_at timestamptz default now()
);

alter table posts enable row level security;`,
        },
      ],
    },
    {
      type: 'metrics',
      items: [
        { label: 'Databases created', value: '16,000,000+' },
        { label: 'Databases launched daily', value: '90,000+' },
        { label: 'GitHub stars', value: '80,000+' },
      ],
    },
    {
      type: 'quote',
      quote:
        'Supabase has completely transformed how we build products. What used to take weeks now takes hours.',
      author: 'Jane Smith',
      role: 'CTO, Acme Corp',
      avatar: {
        src: 'https://i.pravatar.cc/80?u=jane-smith',
        alt: 'Jane Smith',
      },
    },
    {
      type: 'faq',
      title: 'Frequently asked questions',
      description: 'Everything you need to know about getting started with Supabase.',
      items: [
        {
          question: 'What is Supabase?',
          answer:
            'Supabase is an open-source Firebase alternative that provides a Postgres database, authentication, instant APIs, edge functions, real-time subscriptions, and storage. It gives you all the backend services you need to build a product.',
        },
        {
          question: 'How much does Supabase cost?',
          answer:
            'Supabase has a generous free tier that includes 500MB of database space, 1GB of storage, and 50,000 monthly active users. Paid plans start at $25/month for additional resources and features like daily backups and priority support.',
        },
        {
          question: 'Can I self-host Supabase?',
          answer:
            'Yes! Supabase is fully open-source and can be self-hosted using Docker. The official documentation provides detailed guides for deploying Supabase on your own infrastructure.',
        },
        {
          question: 'What frameworks does Supabase support?',
          answer:
            'Supabase provides client libraries for JavaScript/TypeScript, Python, Dart (Flutter), Swift, and Kotlin. It works with any framework including Next.js, React, Vue, Svelte, and more.',
        },
      ],
    },
    {
      type: 'hubspot-meeting',
      title: 'Schedule a meeting',
      description: 'Pick a time that works for you to chat with our team.',
      meetingSlug: 'alan-de-los-santos-rodriguez/test-scheduling-page-go-pages-testing',
    },
    {
      type: 'tweets',
      title: 'Loved by developers',
      description: 'Discover what our community has to say about their Supabase experience.',
      ctas: [
        {
          label: 'Start your project',
          href: 'https://supabase.com/dashboard',
          variant: 'primary',
        },
      ],
    },
    {
      type: 'form',
      title: 'Get in touch',
      description: 'Fill out the form below and our team will get back to you shortly.',
      fields: [
        {
          type: 'text',
          name: 'firstName',
          label: 'First Name',
          placeholder: 'First Name',
          required: true,
          half: true,
        },
        {
          type: 'text',
          name: 'lastName',
          label: 'Last Name',
          placeholder: 'Last Name',
          required: true,
          half: true,
        },
        {
          type: 'email',
          name: 'email',
          label: 'Company Email',
          placeholder: 'Company Email',
          required: true,
        },
        {
          type: 'textarea',
          name: 'interest',
          label: 'What are you interested in?',
          placeholder: 'Share more about what you want to accomplish',
        },
      ],
      submitLabel: 'Request a demo',
      disclaimer:
        'By submitting this form, I confirm that I have read and understood the [Privacy Policy](https://supabase.com/privacy).',
      crm: {
        hubspot: {
          formGuid: 'b9abbf77-86ae-4fe7-9147-d15922bf58ca',
          fieldMap: {
            firstName: 'firstname',
            lastName: 'lastname',
          },
          consent:
            'By submitting this form, I confirm that I have read and understood the Privacy Policy.',
        },
      },
    },
  ],
}

export default page
