import { AIData } from './solutions.types'
import { cn, Image } from 'ui'
import {
  FileText,
  LayoutGrid,
  Scale,
  Timer,
  Database,
  Shield,
  Lock,
  Activity,
  HardDrive,
  Terminal,
  Box,
  ShieldCheck,
  Cpu,
  Sparkle,
  Zap,
  Command,
  Code,
  ArrowRight,
  Key,
  Globe,
  KeyRound,
  Users,
  UserX,
  FolderLock,
  Lightbulb,
  List,
  ClipboardCheck,
  ShieldAlert,
  HeartPulse,
} from 'lucide-react'

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
    title: 'Supabase is the Postgres platform you control',
    subheading: "Supabase includes everything you've come to expect from Neon, and so much more.",
    features: [
      {
        id: 'database',
        title: 'Database',
        icon: Database,
        description: (
          <>
            A fully managed <span className="text-foreground font-medium">Postgres database</span>.
            No forks, no serverless gimmicks.
          </>
        ),
        className: 'col-span-2',
        imageClassName: 'h-[240px]',
        layout: 'table',
        image: {
          dark: '/images/product/database/dashboard-dark.png',
          light: '/images/product/database/dashboard-light.png',
        },
      },
      {
        id: 'authentication',
        title: 'Authentication',
        icon: Shield,
        description: (
          <>
            Secure authentication with{' '}
            <span className="text-foreground font-medium">email/password, magic links, OAuth</span>{' '}
            (Google, GitHub, Twitter, etc.),{' '}
            <span className="text-foreground font-medium">SAML, SSO</span>, and phone/SMS OTP.
          </>
        ),
        className: '',
        imageClassName: 'h-[200px]',
        layout: 'auth',
        image: {
          dark: '/images/product/auth/auth-modal-dark.png',
          light: '/images/product/auth/auth-modal-light.png',
        },
      },
      {
        id: 'access-control',
        title: 'Role-Based Access Control',
        icon: Lock,
        description: (
          <>
            Secure your data <span className="text-foreground font-medium">properly</span>.
          </>
        ),
        className: '',
        imageClassName: 'h-[200px]',
        layout: 'policies',
        image: {
          dark: '/images/product/auth/policies-dark.png',
          light: '/images/product/auth/policies-light.png',
        },
      },
      {
        id: 'realtime',
        title: 'Realtime',
        icon: Activity,
        description: (
          <>
            <span className="text-foreground font-medium">Postgres replication</span> enables live
            sync functionality for collaborative applications.
          </>
        ),
        className: '',
        imageClassName: 'h-[200px]',
        layout: 'realtime',
        image: {
          dark: '/images/product/realtime/realtime-dark.png',
          light: '/images/product/realtime/realtime-light.png',
        },
      },
      {
        id: 'storage',
        title: 'Storage',
        icon: HardDrive,
        description: (
          <>
            <span className="text-foreground font-medium">
              Scalable S3-compatible object storage
            </span>{' '}
            for managing files, images, and videos.
          </>
        ),
        className: '',
        imageClassName: 'h-[200px]',
        layout: 'storage',
        image: {
          dark: '/images/product/storage/storage-dark.png',
          light: '/images/product/storage/storage-light.png',
        },
      },
      {
        id: 'edge-functions',
        title: 'Edge Functions',
        icon: Terminal,
        description: (
          <>
            <span className="text-foreground font-medium">Serverless functions</span> powered by
            Deno, deployed globally for low-latency execution.
          </>
        ),
        className: '',
        imageClassName: 'h-[180px]',
        layout: 'functions',
        image: {
          dark: '/images/product/functions/functions-log-dark.png',
          light: '/images/product/functions/functions-log-light.png',
        },
      },
      {
        id: 'vectors',
        title: 'Vectors',
        icon: Box,
        description: (
          <>
            <span className="text-foreground font-medium">pgvector extension</span> for AI/ML
            applications, enabling fast semantic search and embedding storage.
          </>
        ),
        className: '',
        imageClassName: 'h-[180px]',
        layout: 'vectors',
        image: {
          dark: '/images/product/vector/vector-search-dark.png',
          light: '/images/product/vector/vector-search-light.png',
        },
      },
      {
        id: 'row-level-security',
        title: 'Row Level Security',
        icon: ShieldCheck,
        description: (
          <>
            <span className="text-foreground font-medium">Granular access control</span> policies to
            secure data at the row level.
          </>
        ),
        className: '',
        imageClassName: 'h-[180px]',
        layout: 'rls',
        image: {
          dark: '/images/product/auth/rls-dark.png',
          light: '/images/product/auth/rls-light.png',
        },
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
