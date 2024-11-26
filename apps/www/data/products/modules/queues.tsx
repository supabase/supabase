import { PRODUCT_MODULES } from 'shared-data/products'

export default () => ({
  metaTitle: 'Supabase Queues | Schedule and automate tasks',
  metaDescription: 'Schedule and automate tasks at scale',
  url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
  docsUrl: '/docs/guides/queues',
  heroSection: {
    title: 'Supabase Queues',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        Native pull queues without headache
      </span>
    ),
    subheader: (
      <>
        Manage queues without maintaining additional infrastructure with native PostgreSQL-based
        message queue system.
      </>
    ),
    // image: '/images/product/vector/vector-hero.svg',
    icon: PRODUCT_MODULES.queues.icon[24],
    cta: {
      label: 'Try for free',
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
  section1: {
    id: 'api',
    label: 'API',
    heading: <>Lorem ipsum dolor sit</>,
    subheading:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sagittis in lorem at varius.',
    cta: {
      label: 'Start scheduling',
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
    id: 'UI',
    label: 'UI',
    heading: <>Lorem ipsum dolor sit</>,
    subheading:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sagittis in lorem at varius.',
    // cta: {
    //   label: 'Start scheduling',
    //   url: 'https://supabase.com/dashboard/project/_/integrations/queues/overview',
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
