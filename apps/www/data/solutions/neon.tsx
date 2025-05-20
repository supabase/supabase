import { cn, Image } from 'ui'
import {
  FileText,
  LayoutGrid,
  Scale,
  Timer,
  Lock,
  ShieldCheck,
  Cpu,
  Sparkle,
  Zap,
  Command,
  Code,
  ArrowRight,
  Users,
  UserX,
  FolderLock,
  Lightbulb,
  List,
  ClipboardCheck,
  ShieldAlert,
  HeartPulse,
  Check,
} from 'lucide-react'
import AuthVisual from '../../components/Products/AuthVisual'
import FunctionsVisual from '../../components/Products/FunctionsVisual'
import StorageVisual from '../../components/Products/StorageVisual'
import RealtimeVisual from '../../components/Products/RealtimeVisual'
import VectorVisual from '../../components/Products/VectorVisual'
import MainProducts from '../MainProducts'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'

const data = {
  metadata: {
    metaTitle: 'Supabase for Neon Users',
    metaDescription:
      'The complete Postgres development platform Neon users prefer. Supabase is a composable stack for modern applications: Postgres Database, built-in Auth, Real-time sync, Edge Functions, Storage, and a powerful developer experience.',
  },
  heroSection: {
    id: 'hero',
    title: 'Moving from Neon to Supabase',
    sectionContainerClassName: cn(
      '[&_h1]:text-xl [&_h1]:md:!text-2xl [&_h1]:lg:!text-4xl [&_h1]:2xl:!text-5xl',
      '[&_.image-container]:flex [&_.image-container]:items-center'
    ),
    h1: 'The complete Postgres development platform Neon users prefer',
    subheader: [
      <>
        Supabase is a composable stack for modern applications: Postgres Database, built-in Auth,
        Real-time sync, Edge Functions, Storage, and a powerful developer experience.
      </>,
      <>
        Supabase is the preferred foundation for high-performance, high-scale SaaS, AI-native apps,
        data-intensive tools, and more.
      </>,
    ],
    ctas: [
      {
        label: 'Start your project',
        href: 'https://supabase.com/dashboard',
        type: 'primary' as any,
      },
    ],
    image: (
      <Image
        src={{
          dark: '/images/solutions/neon/neon-hero-dark.svg',
          light: '/images/solutions/neon/neon-hero-light.svg',
        }}
        alt="Neon to Supabase illustration"
        width={1000}
        height={1000}
        className="max-w-[430px] max-h-[300px] m-auto"
      />
    ),
  },
  quote: {
    id: 'quote',
    text: 'We wanted a backend that could accelerate our development while maintaining security and scalability. Supabase stood out due to its automation, integrations, and ecosystem.',
    author: 'Raunak Kathuria',
    role: 'VP of Engineering, Deriv',
    logo: (
      <Image src="/images/solutions/neon/deriv-logo.png" alt="Deriv logo" width={100} height={28} />
    ),
    avatar: '/images/solutions/neon/raunak-avatar.png',
  },
  why: {
    id: 'why-supabase',
    label: '',
    heading: (
      <>
        Why companies moved <span className="text-foreground">to Supabase from Neon</span>
      </>
    ),
    subheading:
      'Build secure, scalable applications using a developer platform built for dependability.',
    features: [
      {
        id: 'speed',
        icon: Timer,
        heading: 'Build fast and with confidence',
        subheading:
          'Supabase helps you go from prototype to production with built-in auth, real-time data, and observability. No setup or backend boilerplate required.',
      },
      {
        id: 'platform',
        icon: LayoutGrid,
        heading: 'Everything your application stack needs',
        subheading:
          'Auth, storage, edge functions, vectors, and realtime are available out of the box. Use one or all.',
      },
      {
        id: 'scalability',
        icon: Scale,
        heading: 'Scalable, dependable, Postgres-native',
        subheading:
          'Supabase runs on standard Postgres with full SQL, ACID guarantees, PITR, and high availability. Designed for reliable, stateful agent workloads.',
      },
      {
        id: 'migration',
        icon: FileText,
        heading: 'Migrate from Neon with ease',
        subheading: 'Supabase is Postgres. Moving from Neon is a breeze.',
      },
    ],
  },
  platform: {
    id: 'postgres-platform',
    title: (
      <>
        Supabase is the Postgres platform <span className="text-foreground">you control</span>
      </>
    ),
    subheading: "Supabase includes everything you've come to expect from Neon, and so much more.",
    features: [
      {
        id: 'database',
        title: 'Database',
        isDatabase: true,
        icon: MainProducts[PRODUCT_SHORTNAMES.DATABASE].icon,
        subheading: (
          <>
            A fully managed Postgres database.
            <br /> No forks, no serverless gimmicks.
          </>
        ),
        className: 'col-span-2 flex-col md:flex-row',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/database-visual-dark.svg',
              light: '/images/solutions/neon/database-visual-light.svg',
            }}
            alt="Database"
            width={100}
            height={100}
            quality={100}
            containerClassName="md:mt-8"
          />
        ),
        highlights: (
          <ul className="hidden md:flex flex-col gap-1 text-sm">
            <li>
              <Check className="inline text-foreground-light h-4 w-4" /> 100% portable
            </li>
            <li>
              <Check className="inline text-foreground-light h-4 w-4" /> Built-in Auth with RLS
            </li>
            <li>
              <Check className="inline text-foreground-light h-4 w-4" /> Easy to extend
            </li>
          </ul>
        ),
      },
      {
        id: 'authentication',
        title: 'Authentication',
        icon: MainProducts[PRODUCT_SHORTNAMES.AUTHENTICATION].icon,
        subheading: (
          <>
            Secure authentication with email/password, magic links, OAuth (Google, GitHub, Twitter,
            etc.), SAML, SSO, and phone/SMS OTP.
          </>
        ),
        className: '!border-t-0',
        image: <AuthVisual className="hidden sm:block" />,
      },
      {
        id: 'rbac',
        title: 'Role-Based Access Control',
        icon: '',
        subheading: <>Secure your data properly.</>,
        className: '!border-l-0',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/rbac-dark.svg',
              light: '/images/solutions/neon/rbac-light.svg',
            }}
            alt="Role Based Access Control diagram"
            width={100}
            height={100}
            quality={100}
            containerClassName="md:mb-4"
          />
        ),
      },
      {
        id: 'realtime',
        title: 'Realtime',
        icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
        subheading: (
          <>
            Postgres replication enables{' '}
            <span className="text-foreground">live sync functionality</span> for collaborative
            applications.
          </>
        ),
        className: '',
        image: <RealtimeVisual className="hidden sm:block" />,
      },
      {
        id: 'storage',
        title: 'Storage',
        icon: MainProducts[PRODUCT_SHORTNAMES.STORAGE].icon,
        subheading: (
          <>
            <span className="text-foreground">Scalable S3-compatible</span> object storage for
            managing files, images, and videos.
          </>
        ),
        className: '',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/storage-dark.svg',
              light: '/images/solutions/neon/storage-light.svg',
            }}
            alt="Storage"
            width={100}
            height={100}
            quality={100}
            containerClassName="md:mb-4"
          />
        ),
      },
      {
        id: 'edge-functions',
        title: 'Edge Functions',
        icon: MainProducts[PRODUCT_SHORTNAMES.FUNCTIONS].icon,
        subheading: (
          <>Serverless functions powered by Deno, deployed globally for low-latency execution.</>
        ),
        className: '!border-l-0',
        image: <FunctionsVisual className="hidden sm:block" />,
      },
      {
        id: 'vectors',
        title: 'Vectors',
        icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
        subheading: (
          <>
            pgvector extension for AI/ML applications, enabling fast semantic search and embedding
            storage.
          </>
        ),
        className: '',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/vectors-dark.svg',
              light: '/images/solutions/neon/vectors-light.svg',
            }}
            alt="Vector embeddings"
            width={100}
            height={100}
            quality={100}
          />
        ),
      },
      {
        id: 'row-level-security',
        title: 'Row Level Security',
        icon: '',
        subheading: <>Granular access control policies to secure data at the row level.</>,
        className: '',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/rls-dark.svg',
              light: '/images/solutions/neon/rls-light.svg',
            }}
            alt="Row Level Security"
            width={100}
            height={100}
            quality={100}
            containerClassName="md:mb-8"
          />
        ),
      },
    ],
  },
  developerExperience: {
    id: 'developer-experience',
    title: 'Developers can build faster with Supabase',
    subheading: 'Features that help developers move quickly and focus.',
    features: [
      {
        id: 'ai-assistant',
        title: 'AI Assistant',
        icon: Sparkle,
        description:
          'A single panel that persists across the Supabase Dashboard and maintains context across AI prompts.',
        supabaseFeature: true,
        neonFeature: false,
        image: {
          dark: '/images/product/ai-assistant/assistant-dark.png',
          light: '/images/product/ai-assistant/assistant-light.png',
        },
      },
      {
        id: 'dashboard',
        title: 'Comprehensive Dashboard',
        icon: Cpu,
        description:
          'Complete observability and tooling in a single interface for all services, including Auth, Storage, and Functions.',
        supabaseFeature: true,
        neonFeature: false,
        image: {
          dark: '/images/product/dashboard/dashboard-dark.png',
          light: '/images/product/dashboard/dashboard-light.png',
        },
      },
      {
        id: 'libraries',
        title: 'Client Libraries',
        icon: Code,
        description:
          'Type-safe, auto-generated client libraries for multiple languages that work with all platform features.',
        supabaseFeature: true,
        neonFeature: false,
        image: {
          dark: '/images/product/clients/client-libraries-dark.png',
          light: '/images/product/clients/client-libraries-light.png',
        },
      },
      {
        id: 'cli',
        title: 'CLI & Local Development',
        icon: Command,
        description:
          'Develop locally with the Supabase CLI, then deploy to the cloud with a single command.',
        supabaseFeature: true,
        neonFeature: false,
        image: {
          dark: '/images/product/cli/cli-dark.png',
          light: '/images/product/cli/cli-light.png',
        },
      },
      {
        id: 'migrations',
        title: 'Seamless Migrations',
        icon: ArrowRight,
        description:
          'Built-in schema migrations with version control integration. Release with confidence.',
        supabaseFeature: true,
        neonFeature: false,
        image: {
          dark: '/images/product/database/migrations-dark.png',
          light: '/images/product/database/migrations-light.png',
        },
      },
      {
        id: 'performance',
        title: 'Performance Optimization',
        icon: Zap,
        description: 'Built-in tooling for query performance analysis and optimization.',
        supabaseFeature: true,
        neonFeature: false,
        image: {
          dark: '/images/product/database/explain-analyze-dark.png',
          light: '/images/product/database/explain-analyze-light.png',
        },
      },
    ],
  },
  resultsSection: {
    id: 'results',
    heading: (
      <>
        Top performance,
        <br />
        at any scale
      </>
    ),
    subheading:
      "Supabase ensures optimal database performance at any scale, so you can focus on innovating and growing without worrying about infrastructure limitations — whether you're handling high-traffic applications, complex queries, or massive data volumes.",
    highlights: [
      {
        heading: 'databases managed',
        subheading: '1,000,000+',
      },
      {
        heading: 'databases launched daily',
        subheading: '2,500+',
      },
    ],
  },
  featureGrid: {
    id: 'feature-grid',
    title: 'Why developers choose Supabase',
    subheading: 'Features you need to build modern applications',
    features: [
      {
        id: 'postgres',
        title: 'Full Postgres capabilities',
        description:
          'Unlock all Postgres features without limitations. Use extensions, functions, triggers, and advanced data types.',
      },
      {
        id: 'authentication',
        title: 'Built-in authentication',
        description:
          'Secure user management with email/password, social logins, SAML, SSO, and phone/SMS verification.',
      },
      {
        id: 'realtime',
        title: 'Realtime data sync',
        description:
          'Build collaborative features with native real-time subscriptions using Postgres replication.',
      },
      {
        id: 'edge-functions',
        title: 'Global edge functions',
        description:
          'Deploy serverless functions globally for consistent low-latency across all regions.',
      },
      {
        id: 'vectors',
        title: 'Vector embeddings',
        description:
          'Store and query AI embeddings directly in your database with built-in pgvector support.',
      },
      {
        id: 'storage',
        title: 'S3-compatible storage',
        description:
          'Manage files, images, and videos with scalable object storage that integrates with your database.',
      },
      {
        id: 'local-dev',
        title: 'Seamless local development',
        description:
          'Develop locally with the same environment as production using the Supabase CLI.',
      },
      {
        id: 'dashboard',
        title: 'Comprehensive dashboard',
        description:
          'Manage your entire stack with a powerful UI that includes table editor, API docs, and observability tools.',
      },
      {
        id: 'security',
        title: 'Enterprise-grade security',
        description:
          'Row-level security, audit logs, custom claims, and network restrictions for all your sensitive data.',
      },
    ],
  },
  securitySection: {
    id: 'security',
    label: 'Security',
    heading: 'Trusted for medical records, missions to the moon, and everything in between',
    subheading:
      "Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your customers' data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.",
    features: [
      {
        icon: ShieldCheck,
        heading: 'SOC 2 Type II certified',
      },
      {
        icon: HeartPulse,
        heading: 'HIPAA compliance',
      },
      {
        icon: ShieldAlert,
        heading: 'DDoS Protection',
      },
      {
        icon: Lock,
        heading: 'Multi-factor Authentication',
      },
      {
        icon: ClipboardCheck,
        heading: 'Vulnerability Management',
      },
      {
        icon: Users,
        heading: 'Role-based access control',
      },
      {
        icon: List,
        heading: 'Database Audit Logs',
      },
      {
        icon: Lightbulb,
        heading: 'Security Advisors',
      },
      {
        icon: FolderLock,
        heading: 'Encrypted Storage',
      },
      {
        icon: UserX,
        heading: 'Network restrictions',
      },
    ],
    cta: {
      label: 'Learn about security',
      url: '/security',
    },
  },
  ctaSection: {
    id: 'get-started',
    title: (
      <>
        Migrate your Neon database to Supabase to{' '}
        <span className="text-foreground">get the most out of Postgres</span> while gaining access
        to all the features you need to build a project
      </>
    ),
    primaryCta: {
      label: 'Open migration guide',
      url: 'https://supabase.com/dashboard',
    },
  },
}

export default data
