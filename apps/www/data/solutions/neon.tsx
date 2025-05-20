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
import RealtimeLogs from '../../components/Products/Functions/RealtimeLogs'
import DataAPIsVisual from '../../components/Products/DataAPIsVisual'

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
        icon: 'M11.8949 2.39344C12.5051 1.78324 13.4944 1.78324 14.1046 2.39344L22.9106 11.1994C23.5208 11.8096 23.5208 12.7989 22.9106 13.4091L14.1046 22.2151C13.4944 22.8253 12.5051 22.8253 11.8949 22.2151L3.08892 13.4091C2.47872 12.7989 2.47872 11.8096 3.08892 11.1994L11.8949 2.39344Z M16.5408 12.3043C16.5408 14.2597 14.9556 15.8449 13.0002 15.8449C11.0448 15.8449 9.45961 14.2597 9.45961 12.3043C9.45961 10.3489 11.0448 8.76371 13.0002 8.76371C14.9556 8.76371 16.5408 10.3489 16.5408 12.3043Z',
        subheading:
          'A single panel that persists across the Supabase Dashboard and maintains context across AI prompts.',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/ai-assistant-dark.svg',
              light: '/images/solutions/neon/ai-assistant-light.svg',
            }}
            alt="Vector embeddings"
            width={100}
            height={100}
            quality={100}
          />
        ),
      },
      {
        id: 'mcp-server',
        title: 'MCP Server',
        icon: 'M19 5L22 2M2 22L5 19M7.5 13.5L10 11M10.5 16.5L13 14M6.3 20.3C6.52297 20.5237 6.78791 20.7013 7.07963 20.8224C7.37136 20.9435 7.68413 21.0059 8 21.0059C8.31587 21.0059 8.62864 20.9435 8.92036 20.8224C9.21209 20.7013 9.47703 20.5237 9.7 20.3L12 18L6 12L3.7 14.3C3.47626 14.523 3.29873 14.7879 3.17759 15.0796C3.05646 15.3714 2.99411 15.6841 2.99411 16C2.99411 16.3159 3.05646 16.6286 3.17759 16.9204C3.29873 17.2121 3.47626 17.477 3.7 17.7L6.3 20.3ZM12 6L18 12L20.3 9.7C20.5237 9.47703 20.7013 9.21209 20.8224 8.92036C20.9435 8.62864 21.0059 8.31587 21.0059 8C21.0059 7.68413 20.9435 7.37136 20.8224 7.07963C20.7013 6.78791 20.5237 6.52297 20.3 6.3L17.7 3.7C17.477 3.47626 17.2121 3.29873 16.9204 3.17759C16.6286 3.05646 16.3159 2.99411 16 2.99411C15.6841 2.99411 15.3714 3.05646 15.0796 3.17759C14.7879 3.29873 14.523 3.47626 14.3 3.7L12 6Z',
        subheading:
          'Connect your favorite AI tools such as Cursor or Claude directly with Supabase.',
        className: '!border-t-0',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/mcp-server-dark.svg',
              light: '/images/solutions/neon/mcp-server-light.svg',
            }}
            alt="Vector embeddings"
            width={100}
            height={100}
            quality={100}
          />
        ),
      },
      {
        id: 'auto-generated-apis',
        title: 'Auto-generated APIs',
        icon: 'M4.13477 12.8129C4.13477 14.1481 4.43245 15.4138 4.96506 16.5471M12.925 4.02271C11.5644 4.02271 10.276 4.33184 9.12614 4.88371M21.7152 12.8129C21.7152 11.4644 21.4115 10.1867 20.8688 9.0447M12.925 21.6032C14.2829 21.6032 15.5689 21.2952 16.717 20.7454M16.717 20.7454C17.2587 21.5257 18.1612 22.0366 19.1831 22.0366C20.84 22.0366 22.1831 20.6935 22.1831 19.0366C22.1831 17.3798 20.84 16.0366 19.1831 16.0366C17.5263 16.0366 16.1831 17.3798 16.1831 19.0366C16.1831 19.6716 16.3804 20.2605 16.717 20.7454ZM4.96506 16.5471C4.16552 17.086 3.63965 17.9999 3.63965 19.0366C3.63965 20.6935 4.98279 22.0366 6.63965 22.0366C8.2965 22.0366 9.63965 20.6935 9.63965 19.0366C9.63965 17.3798 8.2965 16.0366 6.63965 16.0366C6.01951 16.0366 5.44333 16.2248 4.96506 16.5471ZM9.12614 4.88371C8.58687 4.08666 7.67444 3.56274 6.63965 3.56274C4.98279 3.56274 3.63965 4.90589 3.63965 6.56274C3.63965 8.2196 4.98279 9.56274 6.63965 9.56274C8.2965 9.56274 9.63965 8.2196 9.63965 6.56274C9.63965 5.94069 9.45032 5.36285 9.12614 4.88371ZM20.8688 9.0447C21.6621 8.50486 22.1831 7.59464 22.1831 6.56274C22.1831 4.90589 20.84 3.56274 19.1831 3.56274C17.5263 3.56274 16.1831 4.90589 16.1831 6.56274C16.1831 8.2196 17.5263 9.56274 19.1831 9.56274C19.8081 9.56274 20.3884 9.37165 20.8688 9.0447Z',
        subheading:
          "Learn SQL when you're ready. In the meantime, Supabase generates automatic APIs to make coding a lot easier.",
        className: '!border-t-0',
        image: <DataAPIsVisual className="mt-8 md:mt-16" />,
      },
      {
        id: 'foreign-data-wrappers',
        title: 'Foreign Data Wrappers',
        icon: 'M10.2805 18.2121C11.2419 18.6711 12.3325 18.8932 13.4711 18.8084C15.2257 18.6776 16.7596 17.843 17.8169 16.6015M8.21496 8.36469C9.27117 7.14237 10.7928 6.322 12.5311 6.19248C13.7196 6.10392 14.8558 6.34979 15.8474 6.85054M17.8169 16.6015L20.5242 19.3223C22.1857 17.5141 23.1562 15.1497 23.1562 12.5005C23.1562 6.89135 18.6091 2.34424 13 2.34424C10.9595 2.34424 9.16199 2.87659 7.57035 3.91232C8.35717 3.56865 9.22613 3.37801 10.1396 3.37801C12.6236 3.37801 14.7783 4.78762 15.8474 6.85054M17.8169 16.6015V16.6015C16.277 15.059 16.3448 12.5527 16.5387 10.3817C16.5557 10.191 16.5644 9.99794 16.5644 9.80282C16.5644 8.73844 16.3056 7.73451 15.8474 6.85054M13 22.6567C7.39086 22.6567 2.84375 18.1096 2.84375 12.5005C2.84375 9.84123 3.8026 7.48969 5.4753 5.67921L8.21496 8.42354V8.42354C9.76942 9.98064 9.69844 12.5133 9.51947 14.7062C9.50526 14.8803 9.49802 15.0564 9.49802 15.2341C9.49802 18.7705 12.3648 21.6373 15.9012 21.6373C16.8116 21.6373 17.6776 21.4473 18.4618 21.1048C16.8609 22.1588 15.06 22.6567 13 22.6567Z',
        subheading:
          'Connect Supabase to Redshift, BigQuery, MySQL, and external APIs for seamless integrations.',
        className: '!border-l-0',
        image: (
          <Image
            src={{
              dark: '/images/solutions/neon/foreign-data-wrappers-dark.svg',
              light: '/images/solutions/neon/foreign-data-wrappers-light.svg',
            }}
            alt="Vector embeddings"
            containerClassName="md:mb-4"
            width={100}
            height={100}
            quality={100}
          />
        ),
      },
      {
        id: 'instant-deployment',
        title: 'Instant and secure deployment',
        icon: 'M12.5 1.5625C6.45939 1.5625 1.5625 6.45939 1.5625 12.5C1.5625 18.5406 6.45939 23.4375 12.5 23.4375C18.5406 23.4375 23.4375 18.5406 23.4375 12.5C23.4375 9.90692 22.5351 7.52461 21.0273 5.64995L11.6145 15.0627L9.61957 13.0677M12.6068 5.82237C8.92939 5.82237 5.94826 8.80351 5.94826 12.4809C5.94826 16.1583 8.92939 19.1395 12.6068 19.1395C16.2842 19.1395 19.2654 16.1583 19.2654 12.4809C19.2654 11.1095 18.8507 9.83483 18.14 8.77557',
        subheading: 'No need to set up servers, manage DevOps, or tweak security settings.',

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
        id: 'observability',
        title: 'Observability',
        icon: 'M11.1404 7.66537C11.1404 5.18146 13.1541 3.16785 15.638 3.16785H17.3775C19.8614 3.16785 21.875 5.18146 21.875 7.66537V17.3776C21.875 19.8615 19.8614 21.8751 17.3775 21.8751H15.638C13.1541 21.8751 11.1404 19.8615 11.1404 17.3776V7.66537Z M3.125 14.7821C3.125 13.4015 4.24419 12.2823 5.62477 12.2823C7.00536 12.2823 8.12454 13.4015 8.12454 14.7821V19.3754C8.12454 20.7559 7.00536 21.8751 5.62477 21.8751C4.24419 21.8751 3.125 20.7559 3.125 19.3754V14.7821Z M3.125 5.58522C3.125 4.20463 4.24419 3.08545 5.62477 3.08545C7.00536 3.08545 8.12454 4.20463 8.12454 5.58522V6.95164C8.12454 8.33223 7.00536 9.45142 5.62477 9.45142C4.24419 9.45142 3.125 8.33223 3.125 6.95164V5.58522Z',
        subheading:
          'Built-in logs, query performance tools, and security insights for easy debugging.',

        image: (
          <RealtimeLogs isActive={false} isInView={true} className="h-3/5 bottom-0 top-auto" />
        ),
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
