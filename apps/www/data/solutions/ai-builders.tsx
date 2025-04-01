import { Timer } from 'lucide-react'
import { CubeIcon } from '@heroicons/react/outline'
import { Image } from 'ui'

export default {
  metadata: {
    metaTitle: 'Supabase for AI Builders',
    metaDescription:
      'Leading enterprises use Supabase to build faster, better, and more scalable products.',
  },
  heroSection: {
    id: 'hero',
    title: 'AI Builders',
    h1: <>Supabase for AI Builders</>,
    subheader: [
      <>
        Supabase is the Postgres development platform that powers a new generation of developer
        tools. Give your users an integrated, scalable backend that lets them focus on building
        without worrying about infrastructure.
      </>,
    ],
    image: (
      <Image
        src={{
          dark: '/images/solutions/ai-builders/ai-builders-agent-dark.svg',
          light: '/images/solutions/ai-builders/ai-builders-agent-light.svg',
        }}
        alt="AI agent for ai builders"
        width={1000}
        height={1000}
      />
    ),
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard',
        type: 'primary' as any,
      },
      {
        label: 'Request a demo',
        href: '/contact',
        type: 'default' as any,
      },
    ],
    logos: [
      {
        name: 'GitHub',
        image: '/images/enterprise/github.svg',
      },
      {
        name: 'PwC',
        image: '/images/enterprise/pwc.svg',
      },
    ],
  },
  'use-cases': {
    id: 'use-cases',
    // label: <>Build with Supabase</>,
    // heading: <>Stay on the forefront</>,
    stories: [
      {
        // icon: '/images/customers/logos/light/lovable.png',
        // url: '',
        target: '_blank',
        // author: '',
        subheading: (
          <>
            We chose Supabase to supercharge the ability of Lovable.{' '}
            <span className="text-foreground">
              {' '}
              It has almost everything you want from your backend and database.
            </span>{' '}
            And this is where our growth took off even more.
          </>
        ),
      },
      {
        // icon: '/images/customers/logos/light/lovable.png',
        // url: '',
        target: '_blank',
        // author: 'Eric Simmons, CEO Stackblitz',
        subheading: (
          <>
            Supabase is awesome. Supabase is the key database integration that we have. Really, the
            primary and only one we’re pointing people at because{' '}
            <span className="text-foreground">
              it’s the best product in the world for storing and retrieving data
            </span>
            .
          </>
        ),
      },
      {
        // icon: '/images/customers/logos/light/lovable.png',
        // url: '',
        target: '_blank',
        // author: 'Jared Palmer, VP of AI Vercel',
        subheading: (
          <>
            <span className="text-foreground">v0 integrates with Supabase seamlessly.</span> If you
            ask v0 to generate an application and it needs Supabase, you’ll be prompted to create a
            Supabase account right there in the application.
          </>
        ),
      },
    ],
    // highlights: [],
  },
  why: {
    id: 'why-supabase',
    label: '',
    heading: (
      <>
        Why <span className="text-foreground">AI Builders</span> choose Supabase
      </>
    ),
    features: [
      {
        icon: Timer,
        heading: 'Get to market faster',
        subheading:
          'Supabase is easy to use and set up. Use your existing Postgres knowledge and skills. Build with your favorite frameworks and tools.',
      },
      {
        icon: CubeIcon,
        heading: 'The tools you need at a great price',
        subheading:
          'Supabase offers a fully integrated suite of tools including authentication, storage, edge functions, real-time subscriptions, and vector search. Use one or all.',
      },
      {
        icon: () => (
          <svg
            width="23"
            height="23"
            viewBox="0 0 34 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.43881 3.75378C4.10721 1.93324 5.84055 0.723145 7.77992 0.723145H15.6033V0.734736H17.0394C23.8756 0.734736 29.4173 6.27652 29.4173 13.1127V20.1749C29.4173 20.7272 28.9696 21.1749 28.4173 21.1749C27.8651 21.1749 27.4173 20.7272 27.4173 20.1749V13.1127C27.4173 7.38109 22.771 2.73474 17.0394 2.73474H15.4396C15.3877 2.73474 15.3366 2.73078 15.2868 2.72314H7.77992C6.6793 2.72314 5.6956 3.40989 5.31627 4.44308L2.7812 11.3479C2.37375 12.4577 2.69516 13.7038 3.58855 14.4781L5.32807 15.9856C6.12772 16.6786 6.58711 17.6847 6.58709 18.7428L6.58706 21.5134C6.58702 23.8192 8.45627 25.6885 10.7621 25.6885C11.4007 25.6885 11.9184 25.1708 11.9184 24.5322L11.9185 12.1874C11.9185 9.59233 12.955 7.10481 14.7977 5.27761C15.1899 4.88873 15.823 4.8914 16.2119 5.28357C16.6008 5.67574 16.5981 6.3089 16.2059 6.69777C14.742 8.14943 13.9185 10.1257 13.9185 12.1874L13.9184 24.5323C13.9184 26.2754 12.5053 27.6885 10.7621 27.6885C7.35169 27.6885 4.58701 24.9238 4.58706 21.5134L4.58709 18.7428C4.5871 18.2647 4.37953 17.8101 4.01822 17.497L2.27871 15.9894C0.757203 14.6708 0.209829 12.5486 0.90374 10.6586L3.43881 3.75378ZM16.539 18.5225C17.0348 18.2791 17.634 18.4838 17.8773 18.9796C19.1969 21.6686 21.9313 23.3727 24.9267 23.3726L32.8043 23.3726C33.3566 23.3725 33.8043 23.8203 33.8043 24.3725C33.8044 24.9248 33.3566 25.3725 32.8044 25.3726L29.4081 25.3726C29.4142 25.4172 29.4173 25.4628 29.4173 25.5091C29.4173 29.0627 26.1868 31.4165 22.6091 31.4165C19.2966 31.4165 16.5385 29.0518 15.9271 25.9188C15.8213 25.3767 16.175 24.8516 16.717 24.7458C17.2591 24.64 17.7843 24.9936 17.89 25.5357C18.3217 27.7475 20.2716 29.4165 22.6091 29.4165C25.447 29.4165 27.4173 27.6256 27.4173 25.5091C27.4173 25.4628 27.4205 25.4172 27.4266 25.3726L24.9267 25.3726C21.1684 25.3727 17.7375 23.2346 16.0818 19.8607C15.8385 19.3649 16.0432 18.7658 16.539 18.5225Z"
              fill="hsl(var(--foreground-light))"
            />
            <path
              d="M21.7224 13.0006C21.7224 13.6338 22.2358 14.1472 22.869 14.1472C23.5022 14.1472 24.0156 13.6338 24.0156 13.0006C24.0156 12.3674 23.5022 11.854 22.869 11.854C22.2358 11.854 21.7224 12.3674 21.7224 13.0006Z"
              fill="hsl(var(--foreground-light))"
            />
          </svg>
        ),
        heading: 'Scalable and dependable',
        subheading:
          'Supabase is Postgres, with all the performance, high availability, and flexibility your users need to grow.',
      },
    ],
  },
  features: {
    id: 'features',
    label: '',
    heading: (
      <>
        Supabase powers <span className="text-foreground block">next generation tools</span>
      </>
    ),
    subheading:
      'Build a delightful application building experience backed seamlessly by a powerful application backend.',
    features: {
      'mgmt-api': {
        icon: Timer,
        heading: <>"icon" Management API</>,
        subheading: (
          <>
            <span className="text-foreground">Enable your customers to scale their projects.</span>{' '}
            Use the Management API to programmatically back every project with a powerful Supabase
            backend.
          </>
        ),
        img: '/images/solutions/ai-builders/mgmt-api.png',
      },
      postgres: {
        icon: Timer,
        heading: <>"icon" A complete platform, built on Postgres</>,
        subheading: (
          <>
            <span className="text-foreground">
              Build on powerful platform that grows with your customers.
            </span>{' '}
            Supabase offers the tools developers need to build powerful applications. Your customers
            will appreciate knowing they can start quickly with a prototype and scale to millions
            with ease.
          </>
        ),
        img: '/images/solutions/ai-builders/postgres.png',
      },
      branching: {
        icon: Timer,
        heading: <>"icon" Branching</>,
        subheading: (
          <>
            <span className="text-foreground">Offer production and development branches.</span>{' '}
            Enable your customers to deploy and test changes without affecting their main production
            applications.
          </>
        ),
      },
      pricing: {
        icon: Timer,
        heading: <>"icon" Pricing</>,
        subheading: (
          <>
            <span className="text-foreground">Pricing that’s designed for builders.</span> Supabase
            offers pricing options for AI Builders that enable you to build substantial businesses
            that empower your users to go into production.
          </>
        ),
      },
    },
  },
  testimonials: {
    id: 'testimonials',
    label: '',
    heading: (
      <>
        Powerful tools, <span className="text-foreground block">powered by Supabase</span>
      </>
    ),
    subheading:
      'Build a delightful application building experience backed seamlessly by a powerful application backend.',
    videos: {
      lovable: {
        url: '',
      },
      bolt: {
        url: '',
      },
    },
  },
  'cta-section': {
    id: 'connect-to-supabase',
    label: '',
    heading: <>Connect your app to Supabase now</>,
    subheading:
      'Set up a Supabase OAuth app so your users can start interacting with their Supabase Project.',
    cta: {
      label: 'View docs',
      href: 'https://supabase.com/docs/guides/auth/auth-google',
      type: 'text',
    },
  },
}
