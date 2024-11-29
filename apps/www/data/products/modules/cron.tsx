// import Image from 'next/image'
import { PRODUCT_MODULES } from 'shared-data/products'
import BrowserFrame from '../../../components/BrowserFrame'
import { Image } from 'ui'

export default () => ({
  metaTitle: 'Supabase Cron | Schedule and automate tasks',
  metaDescription: 'Schedule and automate tasks at scale',
  url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
  docsUrl: '/docs/guides/cron',
  heroSection: {
    title: 'Supabase Cron',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        Schedule and automate tasks using Postgres
      </span>
    ),
    subheader: (
      <>
        Supabase Cron is a Postgres module that uses the pg_cron extension to manage recurring
        tasks. Manage your cron jobs using any Postgres tooling.
      </>
    ),
    // image: '/images/product/vector/vector-hero.svg',
    icon: PRODUCT_MODULES['cron-jobs'].icon[24],
    cta: {
      label: 'Try for free',
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
        title: 'Postgres native',
        paragraph: 'Schedule and run tasks directly within your database.',
        // image: ,
      },
      {
        title: 'Real-time Monitoring',
        paragraph: "Track and debug scheduled jobs with Supabase's observability tools.",
        // image: ,
      },
      {
        title: 'Extensible toolkit',
        paragraph: 'Works with Database Functions, Edge Functions, and HTTP Webhooks.',
        // image: ,
      },
      {
        title: 'Open source',
        paragraph: 'Built on trusted, community-driven technology. 100% open source.',
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
    heading: <>SQL-based Approach</>,
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
    id: 'UI',
    label: 'UI',
    heading: <>Intuitive interface</>,
    subheading: 'Supabase provides a clean and simple interface for managing and debugging Jobs.',
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
  section3: {
    id: 'extensible',
    label: 'Extensible',
    heading: <>Extensible</>,
    subheading:
      'Supabase Cron is integrated with the entire Supabase suite of tools. Create jobs to call Database Functions, Edge Functions, and even remote webhooks.',
    image: (
      <Image
        src={{
          dark: '/images/auth-ui/modules/cron/cron-extensible-dark.png',
          light: '/images/auth-ui/modules/cron/cron-extensible-light.png',
        }}
        alt="Cron Jobs UI"
        containerClassName="bg-cover object-cover [&_img]:border"
        className="w-full max-w-[490px] aspect-[1/0.99] object-cover bg-cover rounded-lg overflow-hidden shadow-lg"
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
