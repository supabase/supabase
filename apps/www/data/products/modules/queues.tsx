import { PRODUCT_MODULES } from 'shared-data/products'

export default () => ({
  metaTitle: 'Supabase Queues | Message Queues with Guaranteed Delivery',
  metaDescription: 'Message Queues with Guaranteed Delivery',
  url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
  docsUrl: '/docs/guides/queues',
  heroSection: {
    title: 'Supabase Queues',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        Create and Manage Message Queues using Postgres
      </span>
    ),
    subheader: (
      <>
        Supabase Queues is a Postgres module that uses the pgmq database extension to manage Message
        Queues with guarenteed delivery. Manage your Queues using any Postgres tooling.
      </>
    ),
    // image: '/images/product/vector/vector-hero.svg',
    icon: PRODUCT_MODULES.queues.icon[24],
    cta: {
      label: 'Create your first Queue',
      link: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/queues',
    },
  },
  highlightsSection: {
    className: '!py-4',
    highlights: [
      {
        title: 'Postgres Native',
        paragraph: 'Create and Manage Queues directly within your database.',
        // image: ,
      },
      {
        title: 'Exactly Once Message Delivery',
        paragraph: 'Supabase Queues delivers a message exactly once within a visibility timeout.',
        // image: ,
      },
      {
        title: 'Message Archival',
        paragraph: 'Messages in Queues can be archived instead of deleted for future reference.',
        // image: ,
      },
      {
        title: 'Real-Time Monitoring',
        paragraph: "Track and manage messages in your Queues with Supabase's observability tools.",
        // image: ,
      },
      {
        title: '100% Open Source',
        paragraph: 'Built on trusted, community-driven technology.',
        // image: ,
      },
    ],
  },
  centeredImage: {
    image: () => (
      <div className="w-full aspect-[2/1] md:aspect-[3/1] rounded-lg bg-surface-100 text-foreground-lighter p-8 flex items-center justify-center">
        image here
      </div>
    ),
  },
  section1: {
    id: 'sql',
    label: 'SQL',
    heading: <>Manage via SQL</>,
    subheading: 'Create Queues and manage messages using SQL with any Postgres client.',
    cta: {
      label: 'Start message queuing',
      url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    // features: [
    //   {
    //     icon: ShieldCheck,
    //     heading: 'SOC 2 Type II certified',
    //   },
    //   {
    //     icon: Activity,
    //     heading: 'HIPAA compliant',
    //   },
    //   {
    //     icon: ShieldAlert,
    //     heading: 'DDoS Protection',
    //   },
    // ],
  },
  section2: {
    id: 'api',
    label: 'API',
    heading: <>Manage via API</>,
    subheading:
      'Create and manage messages either server-side or client-side via PostgREST using any Supabase client library.',
    cta: {
      label: 'Start message queuing',
      url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    // features: [
    //   {
    //     icon: ShieldCheck,
    //     heading: 'SOC 2 Type II certified',
    //   },
    //   {
    //     icon: Activity,
    //     heading: 'HIPAA compliant',
    //   },
    //   {
    //     icon: ShieldAlert,
    //     heading: 'DDoS Protection',
    //   },
    // ],
  },
  section3: {
    id: 'ui',
    label: 'UI',
    heading: <>Manage and Monitor via Dashboard</>,
    subheading:
      'Create Queues and manage messages in the Dashboard as well as monitor your Queues and message processing in real-time.',
    cta: {
      label: 'Start message queuing',
      url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
    },
    // features: [
    //   {
    //     icon: ShieldCheck,
    //     heading: 'SOC 2 Type II certified',
    //   },
    //   {
    //     icon: Activity,
    //     heading: 'HIPAA compliant',
    //   },
    //   {
    //     icon: ShieldAlert,
    //     heading: 'DDoS Protection',
    //   },
    // ],
  },
})
