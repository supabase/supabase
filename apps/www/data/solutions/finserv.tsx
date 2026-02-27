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

import { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'
import { frameworks } from 'components/Hero/HeroFrameworks'

import type { FeatureGridProps } from 'components/Solutions/FeatureGrid'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { ResultsSectionProps } from 'components/Solutions/ResultsSection'
import type { SecuritySectionProps } from 'components/Enterprise/Security'
import { FrameworkLink, type FeaturesSection, type HeroSection, type Metadata } from './solutions.utils'
import { getSharedSections } from './shared-sections'
import MainProducts from '../MainProducts'
import { Image } from 'ui'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'

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
  const shared = getSharedSections()
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Supabase for Financial Services',
      metaDescription:
        'Secure, compliant financial applications without the complexity. SOC 2, ACID transactions, real-time data, and audit trails built in.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for Financial Services',
      h1: (
        <>
          <span className="block text-foreground">Secure, compliant financial applications</span>
          <span className="block md:ml-0">without the complexity.</span>
        </>
      ),
      subheader: [
        <>
          Supabase is a Postgres development platform with SOC 2 certification, ACID transactions,
          real-time data, and audit trails built in. Build for trading, payments, lending, and
          embedded finance from one platform.
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
              properties: { buttonLocation: 'Solutions: FinServ page hero' },
            }),
        },
        {
          label: 'Request a demo',
          href: 'https://supabase.com/contact/sales',
          type: 'default' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'request_demo_button_clicked',
              properties: { buttonLocation: 'Solutions: FinServ page hero' },
            }),
        },
      ],
    },
    singleQuote: {
      id: 'social-proof',
      quote: {
        text: '"We wanted a backend that could accelerate our development while maintaining security and scalability. Supabase stood out due to its automation, integrations, and ecosystem."',
        author: 'Raunak Kathuria',
        role: 'VP of Engineering, Deriv',
        link: '/customers/deriv',
        logo: (
          <Image
            src="/images/customers/logos/deriv.png"
            alt="Deriv"
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
          Why <span className="text-foreground">financial services companies</span> choose Supabase
        </>
      ),
      subheading: 'Build secure, scalable financial applications using a trusted data platform.',
      features: [
        {
          id: 'compliance',
          icon: ShieldCheck,
          heading: 'Compliance you can prove, not just claim.',
          subheading:
            'SOC 2 Type II certified with comprehensive audit logs, encryption at rest and in transit, and database-level access controls. Meet regulatory requirements with infrastructure that documents every action automatically.',
        },
        {
          id: 'transactional-integrity',
          icon: Check,
          heading: 'Transactional integrity at every layer.',
          subheading:
            'Postgres provides full ACID compliance for settlements, reversals, and multi-step financial operations. No partial writes, no eventual consistency surprises. Your ledger stays correct.',
        },
        {
          id: 'realtime-data',
          icon: MainProducts[PRODUCT_SHORTNAMES.REALTIME].icon,
          heading: 'Real-time data for real-time decisions.',
          subheading:
            'Process transactions, detect fraud signals, and push updates to dashboards as they happen. Realtime subscriptions and Edge Functions give your applications the speed financial workloads demand.',
        },
      ],
    },
    platform: {
      ...shared.platform,
      title: (
        <>
          Supabase is the <span className="text-foreground">SOC 2-compliant Postgres platform</span>{' '}
          you control
        </>
      ),
      subheading: 'Supabase includes everything you need to build secure, compliant financial applications.',
    },
    developerExperience: shared.developerExperience,
    resultsSection: shared.resultsSection,
    featureGrid: shared.featureGrid,
    securitySection: {
      id: 'security',
      label: 'Security',
      heading: (
        <>
          Trusted for <span className="text-foreground">financial solutions and transactions of all types</span>
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
          code: "Generate Row Level Security policies for secure access control. Retrieve your schema, then write policies that restrict access to sensitive data based on user roles and auth.uid().",
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
          name: 'Deriv',
          logo: '/images/customers/logos/deriv.png',
          highlights: [
            'Accelerating online trading with scalable Postgres',
            'Automation, integrations, and ecosystem',
          ],
          cta: { label: 'Read the case study', href: '/customers/deriv' },
        },
        {
          name: 'Bree',
          logo: '/images/customers/logos/bree.png',
          highlights: [
            '10X performance gains when switching from Fauna',
            'Greater developer velocity and AI-ready foundation',
          ],
          cta: { label: 'Read the case study', href: '/customers/bree' },
        },
        {
          name: 'Next Door Lending',
          logo: '/images/customers/logos/next-door-lending.png',
          highlights: [
            'Top 10 mortgage broker with Supabase',
            'Leveraged Postgres for lending workflows',
          ],
          cta: { label: 'Read the case study', href: '/customers/next-door-lending' },
        },
        {
          name: 'Rally',
          logo: '/images/customers/logos/rally.png',
          highlights: ['Building financial applications on Supabase'],
          cta: { label: 'Read the case study', href: '/customers/rally' },
        },
        {
          name: 'Xendit',
          logo: '/images/customers/logos/xendit.png',
          highlights: [
            'Full solution shipped to production in less than one week',
            'Payment processor with transaction verification',
          ],
          cta: { label: 'Read the case study', href: '/customers/xendit' },
        },
      ],
    },
  }
}

export default data
