import dynamic from 'next/dynamic'
import {
  Check,
  ClipboardCheck,
  FolderLock,
  HeartPulse,
  Lightbulb,
  List,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserX,
} from 'lucide-react'
import { CubeIcon } from '@heroicons/react/outline'
import { Image } from 'ui'

import { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'
import { frameworks } from 'components/Hero/HeroFrameworks'

import type { FeatureGridProps } from 'components/Solutions/FeatureGrid'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { ResultsSectionProps } from 'components/Solutions/ResultsSection'
import type { SecuritySectionProps } from 'components/Enterprise/Security'
import { FrameworkLink, type FeaturesSection, type HeroSection, type Metadata } from './solutions.utils'
import { getSharedSections } from './shared-sections'

import { useBreakpoint } from 'common'
import { useSendTelemetryEvent } from 'lib/telemetry'

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  singleQuote: {
    id: string
    quote: {
      text: string
      author: string
      role: string
      link?: string
      logo?: React.ReactElement
    }
  }
  why: FeaturesSection
  platform: PlatformSectionProps
  developerExperience: ReturnType<typeof getSharedSections>['developerExperience']
  resultsSection: ResultsSectionProps
  featureGrid: FeatureGridProps
  securitySection: SecuritySectionProps
  platformStarterSection: TwoColumnsSectionProps
  customerEvidence: {
    id: string
    heading: React.ReactNode
    customers: Array<{
      name: string
      logo?: string
      highlights: string[]
      cta?: { label: string; href: string }
    }>
  }
} = () => {
  const isXs = useBreakpoint(640)
  const shared = getSharedSections()
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Supabase for B2B SaaS',
      metaDescription:
        'Ship faster. Scale smarter. Own your backend. Supabase gives B2B SaaS teams the tools to build, launch, and scale modern applications.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for B2B SaaS',
      h1: (
        <>
          <span className="block text-foreground">Ship faster. Scale smarter.</span>
          <span className="block md:ml-0">Own your backend.</span>
        </>
      ),
      subheader: [
        <>
          Supabase gives B2B SaaS teams the tools to build, launch, and scale modern applications
          without backend complexity. Focus on product velocity, multi-tenant architecture, and zero
          backend boilerplate.
        </>,
      ],
      image: undefined,
      ctas: [
        {
          label: 'Start your project',
          href: 'https://supabase.com/dashboard',
          type: 'primary' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'start_project_button_clicked',
              properties: { buttonLocation: 'Solutions: B2B SaaS page hero' },
            }),
        },
        {
          label: 'Request a demo',
          href: 'https://supabase.com/contact/sales',
          type: 'default' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'request_demo_button_clicked',
              properties: { buttonLocation: 'Solutions: B2B SaaS page hero' },
            }),
        },
      ],
    },
    singleQuote: {
      id: 'social-proof',
      quote: {
        text: '"Supabase enabled us to focus on building the best email infrastructure for developers, without worrying about backend complexity."',
        author: 'Zeno Rocha',
        role: 'CEO, Resend',
        link: '/customers/resend',
        logo: (
          <Image
            src="/images/customers/logos/resend.png"
            alt="Resend"
            width={128}
            height={48}
            className="object-contain w-24 md:w-32"
          />
        ),
      },
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          Why <span className="text-foreground">B2B SaaS companies</span> choose Supabase
        </>
      ),
      subheading:
        'Build high-velocity SaaS products on a modern backend platform that balances developer speed with architectural integrity.',
      features: [
        {
          id: 'multi-tenant',
          icon: CubeIcon,
          heading: 'Ship multi-tenant apps without the plumbing.',
          subheading:
            'RLS enforces tenant isolation at the database layer. RBAC controls what each user role can access. No custom middleware, no tenant-routing code, no data leakage risk.',
        },
        {
          id: 'own-your-data',
          icon: Lock,
          heading: 'Own your data layer, avoid lock-in.',
          subheading:
            'Supabase is just Postgres. No proprietary query language, no vendor-specific APIs. Export your data, self-host if you need to, and keep full control of your architecture.',
        },
        {
          id: 'scale',
          icon: Check,
          heading: 'Scale from first customer to enterprise tier.',
          subheading:
            'Start free, scale to millions of rows with read replicas, connection pooling, and HA failover. Same platform from prototype through SOC 2 audit.',
        },
      ],
    },
    platform: {
      ...shared.platform,
      title: (
        <>
          Supabase is the <span className="text-foreground">Postgres platform</span> you control
        </>
      ),
      subheading:
        'Supabase includes everything you need to deliver robust, scalable, and dependable software as a service.',
    },
    developerExperience: shared.developerExperience,
    resultsSection: shared.resultsSection,
    featureGrid: shared.featureGrid,
    securitySection: {
      id: 'security',
      label: 'Security',
      heading: (
        <>
          Trusted for <span className="text-foreground">B2B SaaS solutions at every stage</span>
        </>
      ),
      subheading:
        "Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your customers' data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.",
      features: [
        { icon: ShieldCheck, heading: 'SOC 2 Type II certified' },
        { icon: HeartPulse, heading: 'HIPAA compliant' },
        { icon: ShieldAlert, heading: 'DDoS Protection' },
        { icon: Lock, heading: 'Multi-factor Authentication' },
        { icon: ClipboardCheck, heading: 'Vulnerability Management' },
        { icon: Users, heading: 'Role-based access control' },
        { icon: List, heading: 'Database Audit Logs' },
        { icon: Lightbulb, heading: 'Security Advisors' },
        { icon: FolderLock, heading: 'Encrypted Storage' },
        { icon: UserX, heading: 'Network restrictions' },
      ],
      cta: {
        label: 'Learn about security',
        url: '/security',
      },
    },
    platformStarterSection: {
      id: 'quickstarts',
      heading: (
        <>
          <span className="text-foreground">Choose your platform</span> to start building in seconds
        </>
      ),
      headingRight: (
        <>
          Or, start with <span className="text-foreground">Supabase AI Prompts</span>
        </>
      ),
      docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts',
      leftFooter: (
        <div className="grid grid-cols-5 divide-x divide-y rounded-lg overflow-hidden border">
          {frameworks.map((framework) => (
            <FrameworkLink key={framework.name} framework={framework} />
          ))}
        </div>
      ),
      aiPrompts: [
        {
          id: 'auth-setup',
          title: 'Bootstrap Next.js app with Supabase Auth',
          code: 'Set up Supabase Auth with Next.js: install @supabase/supabase-js and @supabase/ssr, configure environment variables, create browser and server clients, and add middleware for token refresh.',
          language: 'markdown',
          docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth',
        },
        {
          id: 'rls-policies',
          title: 'Create RLS policies',
          code: "Generate Row Level Security policies for tenant isolation. Retrieve your schema, then write policies that restrict users to their tenant's data using the auth.uid() or custom claims.",
          language: 'markdown',
          docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts/database-rls-policies',
        },
      ],
    },
    customerEvidence: {
      id: 'case-studies',
      heading: (
        <>
          Case <span className="text-foreground">studies</span>
        </>
      ),
      customers: [
        {
          name: 'Resend',
          logo: '/images/customers/logos/resend.png',
          highlights: [
            'Focus on building the best email infrastructure for developers',
            'Backend complexity handled by Supabase',
          ],
          cta: { label: 'Read the case study', href: '/customers/resend' },
        },
        {
          name: 'Mobbin',
          logo: '/images/customers/logos/mobbin.png',
          highlights: [
            'Migrated 200,000 users from Firebase',
            'Better authentication experience at scale',
          ],
          cta: { label: 'Read the case study', href: '/customers/mobbin' },
        },
        {
          name: 'Shotgun',
          logo: '/images/customers/logos/shotgun.png',
          highlights: [
            '83% reduction in data infrastructure costs',
            'Remarkable database efficiency through migration',
          ],
          cta: { label: 'Read the case study', href: '/customers/shotgun' },
        },
        {
          name: 'Quilia',
          logo: '/images/customers/logos/quilia.png',
          highlights: [
            '75% reduction in development time',
            '50% lower costs with enhanced security for sensitive client data',
          ],
          cta: { label: 'Read the case study', href: '/customers/quilia' },
        },
      ],
    },
  }
}

export default data
