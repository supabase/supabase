import {
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
import type { WhatItTakesSectionProps } from 'components/Solutions/WhatItTakesSection'
import {
  FrameworkLink,
  type FeaturesSection,
  type HeroSection,
  type Metadata,
} from './solutions.utils'
import { getSharedSections } from './shared-sections'
import { Image } from 'ui'

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
  whatItTakes: WhatItTakesSectionProps
} = () => {
  const shared = getSharedSections()
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Supabase for Healthcare',
      metaDescription:
        'HIPAA-compliant from day one. Build patient-facing applications, clinical tools, and health data platforms with compliance built in.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for Healthcare',
      h1: (
        <>
          <span className="block text-foreground">HIPAA-compliant from day one.</span>
          <span className="block md:ml-0">Build with confidence.</span>
        </>
      ),
      subheader: [
        <>
          Supabase provides a fully managed, HIPAA-compliant Postgres platform with PHI protection, a
          signed BAA, and audit-ready infrastructure. Build patient-facing applications, clinical
          tools, and health data platforms with compliance built in.
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
              properties: { buttonLocation: 'Solutions: Healthcare page hero' },
            }),
        },
        {
          label: 'Request a demo',
          href: 'https://supabase.com/contact/sales',
          type: 'default' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'request_demo_button_clicked',
              properties: { buttonLocation: 'Solutions: Healthcare page hero' },
            }),
        },
      ],
    },
    singleQuote: {
      id: 'social-proof',
      quote: {
        text: '"For me, the biggest benefit of Supabase is developer experience. My expertise doesn\'t lie in databases and infrastructure."',
        author: 'Nick Farrant',
        role: 'Founding Engineer, Juniver',
        link: '/customers/juniver',
        logo: (
          <Image
            src="/images/customers/logos/juniver.png"
            alt="Juniver"
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
          Why <span className="text-foreground">healthcare companies</span> choose Supabase
        </>
      ),
      subheading:
        'Build secure, scalable healthcare applications using a trusted, HIPAA-compliant data platform.',
      features: [
        {
          id: 'hipaa-baa',
          icon: HeartPulse,
          heading: 'HIPAA-compliant with a signed BAA.',
          subheading:
            'Enable the HIPAA add-on, sign a Business Associate Agreement, and store Protected Health Information on infrastructure that meets the Security Rule. Not a checkbox exercise. Real technical and administrative safeguards.',
        },
        {
          id: 'audit-trails',
          icon: List,
          heading: 'Audit trails that satisfy regulators.',
          subheading:
            'Every data access, every modification, every login is logged. Database audit logs and Row Level Security give you the documentation regulators expect during compliance reviews.',
        },
        {
          id: 'patient-data',
          icon: Lock,
          heading: 'Patient data stays where it belongs.',
          subheading:
            'Encrypt at rest and in transit, enforce role-based access controls, and use RLS to guarantee that each provider, clinic, or patient only sees their own data. Multi-region deployment options support data residency requirements.',
        },
      ],
    },
    platform: {
      ...shared.platform,
      title: (
        <>
          Supabase is the <span className="text-foreground">HIPAA-compliant Postgres platform</span>{' '}
          you control
        </>
      ),
      subheading:
        'Supabase includes everything you need to build HIPAA-compliant healthcare applications.',
    },
    developerExperience: shared.developerExperience,
    resultsSection: shared.resultsSection,
    featureGrid: shared.featureGrid,
    securitySection: {
      id: 'security',
      label: 'Security',
      heading: (
        <>
          Trusted for <span className="text-foreground">medical records and health data of all types</span>
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
          code: "Generate Row Level Security policies for healthcare data. Retrieve your schema, then write policies that restrict access to PHI based on user roles, auth.uid(), and organizational boundaries.",
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
          name: 'Juniver',
          logo: '/images/customers/logos/juniver.png',
          highlights: [
            'Automated B2B workflows with Edge Functions and RLS',
            'Improved developer experience and performance',
          ],
          cta: { label: 'Read the case study', href: '/customers/juniver' },
        },
      ],
    },
    whatItTakes: {
      id: 'what-it-takes',
      heading: (
        <>
          What it takes <span className="text-foreground">to be HIPAA-compliant</span> on Supabase
        </>
      ),
      items: [
        {
          id: 'hipaa-guide',
          description:
            'Read our guide on HIPAA and learn more about our shared responsibilities in delivering compliant solutions.',
          url: '/docs/guides/security/hipaa-compliance',
          linkLabel: 'Read more',
        },
        {
          id: 'enable-hipaa',
          description: 'Enable HIPAA compliance in your project.',
          url: '/docs/guides/platform/hipaa-projects',
          linkLabel: 'Read more',
        },
      ],
    },
  }
}

export default data
