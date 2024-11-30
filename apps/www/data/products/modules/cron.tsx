// import Image from 'next/image'
import { PRODUCT_MODULES } from 'shared-data/products'
import BrowserFrame from '../../../components/BrowserFrame'
import { Image } from 'ui'

export default () => ({
  metaTitle: 'Supabase Cron | Schedule and Automate Tasks',
  metaDescription: 'Schedule and Automate Tasks at Scale',
  url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
  docsUrl: '/docs/guides/cron',
  heroSection: {
    title: 'Supabase Cron',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        Schedule and Automate Tasks Using Postgres
      </span>
    ),
    subheader: (
      <>
        Supabase Cron is a Postgres module that uses the pg_cron database extension to manage
        recurring tasks. Manage your Cron Jobs using any Postgres tooling.
      </>
    ),
    // image: '/images/product/vector/vector-hero.svg',
    icon: PRODUCT_MODULES['cron-jobs'].icon[24],
    cta: {
      label: 'Create your first Job',
      link: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/cron',
    },
  },
  highlightsSection: {
    className: '!py-4',
    highlights: [
      {
        title: 'Postgres Native',
        paragraph: 'Schedule and run Jobs directly within your database.',
        // image: ,
      },
      {
        title: 'Cron Syntax and Natural Language',
        paragraph: 'Use familiar Cron syntax or natural language to define your job run interval.',
        // image: ,
      },
      {
        title: 'Sub-Minute Scheduling',
        paragraph: 'Schedule recurring Jobs that run every 1-59 seconds.',
        // image: ,
      },
      {
        title: 'Real-Time Monitoring',
        paragraph: "Track and debug scheduled Jobs with Supabase's observability tools.",
        // image: ,
      },
      {
        title: 'Extensible Toolkit',
        paragraph: 'Works with Database Functions, Edge Functions, and HTTP Webhooks.',
        // image: ,
      },
      {
        title: '100% Open Source',
        paragraph: 'Built on trusted, community-driven technology.',
        // image: ,
      },
    ],
  },
  video: {
    image: (
      <BrowserFrame
        className="overflow-hidden lg:order-last bg-default w-full max-w-6xl mx-auto"
        contentClassName="aspect-video border overflow-hidden rounded-lg"
        hasFrameButtons={false}
      >
        <div className="video-container !border-none !rounded-none">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/abc`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </BrowserFrame>
    ),
  },
  section1: {
    id: 'api',
    label: 'API',
    heading: <>SQL-Based Approach</>,
    subheading:
      'Create and manage Jobs using simple SQL commands for ease of use. Track changes to your cron jobs using Postgres migrations stored in source control.',
    cta: {
      label: 'Start scheduling',
      url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
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
    id: 'UI-Scheduling-Interface',
    label: 'UI',
    heading: <>Intuitive Scheduling Interface</>,
    subheading:
      'Supabase Cron provides a clean and simple interface, including Cron syntax and natural language options, to create Jobs with ease.',
    image: (
      <Image
        src={{
          dark: '/images/auth-ui/modules/cron/cron-ui-dark.png',
          light: '/images/auth-ui/modules/cron/cron-ui-light.png',
        }}
        alt="Cron Jobs UI"
        className="w-full max-w-[490px] aspect-[1/0.88] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    cta: {
      label: 'Start scheduling',
      url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
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
    id: 'UI-Job-Observability',
    label: 'UI',
    heading: <>Job Observability</>,
    subheading:
      'Track and investigate recurring Jobs and their historical runs in the Cron UI and Cron logs.',
    image: (
      <Image
        src={{
          dark: '/images/auth-ui/modules/cron/cron-ui-dark.png',
          light: '/images/auth-ui/modules/cron/cron-ui-light.png',
        }}
        alt="Cron Jobs UI"
        className="w-full max-w-[490px] aspect-[1/0.88] object-cover bg-cover"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    // cta: {
    //   label: 'Start scheduling',
    //   url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
    // },
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
  section4: {
    id: 'extensible',
    label: 'Extensible',
    heading: <>Designed to Just Work</>,
    subheading:
      'Supabase Cron is integrated with the entire Supabase suite of tools. Create Jobs to call Database Functions, Edge Functions, and even remote webhooks.',
    image: (
      <Image
        src={{
          dark: '/images/auth-ui/modules/cron/cron-extensible-dark.png',
          light: '/images/auth-ui/modules/cron/cron-extensible-light.png',
        }}
        alt="Cron Jobs UI"
        containerClassName="bg-cover object-cover"
        className="w-full max-w-[490px] aspect-[1/0.99] object-cover bg-cover rounded-lg overflow-hidden"
        fill
        sizes="100vw, (min-width: 768px) 50vw, (min-width: 1200px) 33vw"
        quality={100}
        draggable={false}
      />
    ),
    // cta: {
    //   label: 'Start scheduling',
    //   url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
    // },
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
