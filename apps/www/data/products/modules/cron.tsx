import { PRODUCT_MODULES } from 'shared-data/products'

export default () => ({
  metaTitle: 'Supabase Cron | Schedule and automate tasks',
  metaDescription: 'Schedule and automate tasks at scale',
  url: 'https://supabase.com/dashboard/project/_/integrations/cron-jobs/overview',
  docsUrl: '/docs/guides/cron',
  heroSection: {
    title: 'Supabase Cron',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        Schedule and automate tasks at scale
      </span>
    ),
    subheader: <>Runs maintenance routines at specified intervals directly inside the database.</>,
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
        title: 'Benefit 1',
        paragraph: 'Lorem ipsum dolor sit amet yeah.',
        // image: ,
      },
      {
        title: 'Benefit 2',
        paragraph: 'Lorem ipsum dolor sit amet ahha.',
        // image: ,
      },
      {
        title: 'Benefit 3',
        paragraph: 'Lorem ipsum dolor sit amet woh.',
        // image: ,
      },
      {
        title: 'Benefit 4',
        paragraph: 'Lorem ipsum dolor sit amet yo.',
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
  apiSection: {
    id: 'api',
    label: 'API',
    heading: <>Lorem ipsum dolor sit</>,
    subheading:
      'Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your customers’ data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.',
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
})
