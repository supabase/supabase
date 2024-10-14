import {
  ChartScatter,
  Database,
  FileCode2,
  GitGraph,
  Lock,
  Cloud,
  UploadCloud,
  Image,
  MessageCircle,
  PhoneCall,
  UserCheck,
  ShieldCheck,
  FileText,
  Package,
  Share2,
  Users,
  BarChart2,
} from 'lucide-react'
import { PRODUCT, PRODUCT_SHORTNAMES } from 'shared-data/products'
import type { LucideIcon } from 'lucide-react'

export type FeatureProductType = PRODUCT | 'MISC'

export type FeatureType = {
  /**
   * name of the feature
   */
  title: string
  /**
   * subtitle will be displayed in the feature card, after the title
   */
  subtitle: string
  /**
   * The body content in the feature page
   */
  description: string
  /**
   * slug of the feature page
   */
  slug: string
  /**
   * icon will be displayed in the feature card
   */
  icon: string | LucideIcon
  /**
   * Each feature belongs to at most one product.
   * Use more than one if only strictly necessary.
   */
  products: FeatureProductType[]
  /**
   * heroImage can either be an absolute path to an image or to a video
   */
  heroImage: string
  /**
   * url to docs page for this feature
   */
  docsUrl?: string
}

export const features: FeatureType[] = [
  // Database
  {
    title: 'Postgres database',
    subtitle: 'Every project is a full Postgres database.',
    description: 'Every project is a full Postgres database.',
    icon: Database,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/overview',
    slug: 'postgres-database',
  },
  {
    title: 'Vector database',
    subtitle: 'Store vector embeddings right next to the rest of your data.',
    description: 'Store vector embeddings right next to the rest of your data.',
    icon: BarChart2,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/ai',
    slug: 'vector-database',
  },
  {
    title: 'Auto-generated Rest API via PostgREST',
    subtitle: 'RESTful APIs auto-generated from your database.',
    description:
      'RESTful APIs are auto-generated from your database, without a single line of code.',
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/api#rest-api-overview',
    slug: 'auto-generated-rest-api',
  },
  {
    title: 'Auto-generated GraphQL API via pg_graphql',
    subtitle: 'Fast GraphQL APIs using our custom Postgres GraphQL extension.',
    description: 'Fast GraphQL APIs using our custom Postgres GraphQL extension.',
    icon: GitGraph,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/graphql/api',
    slug: 'auto-generated-graphql-api',
  },

  // Platform
  {
    title: 'Database backups',
    subtitle: 'Projects are backed up daily with Point in Time recovery options.',
    description:
      'Projects are backed up daily with the option to upgrade to Point in Time recovery.',
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/database/backups',
    slug: 'database-backups',
  },
  {
    title: 'Custom domains',
    subtitle: 'White-label the Supabase APIs for a branded experience.',
    description: 'Create a branded experience for your users using custom domains.',
    icon: Share2,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/custom-domains',
    slug: 'custom-domains',
  },
  {
    title: 'Network restrictions',
    subtitle: 'Restrict IP ranges that can connect to your database.',
    description: 'Enhance security by restricting IP ranges for database access.',
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/network-restrictions',
    slug: 'network-restrictions',
  },
  {
    title: 'SSL enforcement',
    subtitle: 'Enforce secure connections to your Postgres clients.',
    description: 'Ensure that all connections to your database are made securely via SSL.',
    icon: ShieldCheck,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/ssl-enforcement',
    slug: 'ssl-enforcement',
  },

  {
    title: 'Branching',
    subtitle: 'Test and preview changes using Supabase Branches.',
    description: 'Easily test and preview changes before deploying them live.',
    icon: FileText,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/branching',
    slug: 'branching',
  },

  {
    title: 'Terraform provider',
    subtitle: 'Manage Supabase infrastructure via Terraform.',
    description:
      'Use Terraform as an Infrastructure as Code tool to manage your Supabase projects.',
    icon: Package,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/terraform-provider',
    slug: 'terraform-provider',
  },

  {
    title: 'Read replicas',
    subtitle: 'Deploy read-only databases across multiple regions for lower latency.',
    description: 'Improve performance and resource management with read replicas.',
    icon: Users,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/read-replicas',
    slug: 'read-replicas',
  },

  {
    title: 'Fly Postgres',
    subtitle: 'Launch the Supabase stack on Fly.io edge network.',
    description: 'Deploy your Supabase stack on the Fly.io edge network for improved performance.',
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.DATABASE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/platform/fly-postgres',
    slug: 'fly-postgres',
  },

  // Realtime
  {
    title: 'Postgres changes',
    subtitle: 'Receive your database changes through websockets.',
    description:
      'Get real-time updates on changes made to your Postgres database using websockets.',
    icon: MessageCircle,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/postgres-changes',
    slug: 'postgres-changes',
  },

  {
    title: 'Broadcast',
    subtitle: 'Send messages between connected users through websockets.',
    description:
      'Enable real-time communication by broadcasting messages between users via websockets.',
    icon: MessageCircle,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/broadcast',
    slug: 'broadcast',
  },

  {
    title: 'Presence',
    subtitle:
      'Synchronize shared state across users, including online status and typing indicators.',
    description:
      'Keep track of user presence and synchronize shared state in real-time applications.',
    icon: Users,
    products: [PRODUCT_SHORTNAMES.REALTIME],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/realtime/presence',
    slug: 'presence',
  },

  // Auth
  {
    title: 'Email login',
    subtitle: 'Build email logins for your application or website.',
    description: 'Implement email-based authentication for users in your application easily.',
    icon: UserCheck,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/email-login',
    slug: 'email-login',
  },

  {
    title: 'Social login',
    subtitle: 'Provide social logins from platforms like Apple, GitHub, and Slack.',
    description: 'Allow users to log in using their social media accounts seamlessly.',
    icon: Users,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/social-login',
    slug: 'social-login',
  },

  {
    title: 'Phone logins',
    subtitle: 'Provide phone logins using a third-party SMS provider.',
    description: 'Implement phone number authentication using SMS verification easily.',
    icon: PhoneCall,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/phone-login',
    slug: 'phone-logins',
  },

  {
    title: 'Passwordless login',
    subtitle: 'Build passwordless logins via magic links for your application or website.',
    description: 'Enhance user experience by implementing passwordless authentication easily.',
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/passwordless-login',
    slug: 'passwordless-login',
  },

  {
    title: 'Authorization via Row Level Security',
    subtitle: 'Control the data each user can access with Postgres Policies.',
    description: 'Implement fine-grained access control using Row Level Security in Postgres.',
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/row-level-security',
    slug: 'row-level-security',
  },

  {
    title: 'Captcha protection',
    subtitle: 'Add Captcha to your sign-in, sign-up, and password reset forms.',
    description: 'Enhance security by integrating Captcha into authentication forms.',
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/captcha',
    slug: 'captcha-protection',
  },

  {
    title: 'Server-side Auth',
    subtitle: 'Helpers for implementing user authentication in popular server-side languages.',
    description:
      'Utilize server-side helpers for user authentication in frameworks like Next.js and SvelteKit.',
    icon: Lock,
    products: [PRODUCT_SHORTNAMES.AUTHENTICATION],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/auth/server-side-auth',
    slug: 'server-side-auth',
  },

  // Storage
  {
    title: 'File storage',
    subtitle: 'Supabase Storage makes it simple to store and serve files.',
    description: 'Easily store and serve files using Supabase Storage.',
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/file-storage',
    slug: 'file-storage',
  },

  {
    title: 'Content Delivery Network',
    subtitle: 'Cache large files using the Supabase CDN.',
    description: 'Optimize file delivery by caching large files through our CDN.',
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/cdn',
    slug: 'cdn',
  },

  {
    title: 'Smart Content Delivery Network',
    subtitle: 'Automatically revalidate assets at the edge via the Smart CDN.',
    description: 'Ensure assets are always up-to-date while being served from the edge.',
    icon: Cloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/smart-cdn',
    slug: 'smart-cdn',
  },

  {
    title: 'Image transformations',
    subtitle: 'Transform images on the fly.',
    description: 'Apply transformations to images dynamically as they are requested.',
    icon: Image,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/image-transformations',
    slug: 'image-transformations',
  },

  {
    title: 'Resumable uploads',
    subtitle: 'Upload large files using resumable uploads.',
    description: 'Support large file uploads that can be resumed after interruptions.',
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/resumable-uploads',
    slug: 'resumable-uploads',
  },

  {
    title: 'S3 compatibility',
    subtitle: 'Interact with Storage from tools which support the S3 protocol.',
    description: 'Use existing S3-compatible tools to interact with Supabase Storage seamlessly.',
    icon: UploadCloud,
    products: [PRODUCT_SHORTNAMES.STORAGE],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/storage/s3-compatibility',
    slug: 's3-compatibility',
  },

  // Functions
  {
    title: 'Deno Edge Functions',
    subtitle: 'Globally distributed TypeScript functions to execute custom business logic.',
    description: 'Run custom business logic globally using Deno Edge Functions.',
    icon: FileCode2,
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/deno-edge-functions',
    slug: 'deno-edge-functions',
  },

  {
    title: 'Regional invocations',
    subtitle: 'Execute an Edge Function in a region close to your database.',
    description: 'Optimize performance by running Edge Functions close to your data source.',
    icon: Cloud, // Replace with appropriate Icon
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/regional-invocations',
    slug: 'regional-invocations',
  },

  {
    title: 'NPM compatibility',
    subtitle: 'Edge functions natively support NPM modules and Node built-in APIs.',
    description: 'Leverage NPM packages and Node APIs easily within Edge Functions.',
    icon: FileCode2, // Replace with appropriate Icon
    products: [PRODUCT_SHORTNAMES.FUNCTIONS],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/functions/npm-compatibility',
    slug: 'npm-compatibility',
  },

  // Project management
  {
    title: 'CLI',
    subtitle: 'Use our CLI to develop your project locally and deploy.',
    description: 'Develop projects locally and deploy them easily using our CLI.',
    icon: FileCode2,
    products: ['MISC'],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/project-management/cli',
    slug: 'cli',
  },

  {
    title: 'Management API',
    subtitle: 'Manage your projects programmatically.',
    description: 'Use our Management API for programmatic control over your projects.',
    icon: FileCode2,
    products: ['MISC'],
    heroImage: '',
    docsUrl: 'https://supabase.com/docs/guides/project-management/api',
    slug: 'management-api',
  },
]
