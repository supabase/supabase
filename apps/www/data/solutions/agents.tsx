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

import { TwoColumnsSectionProps } from '~/components/Solutions/TwoColumnsSection'
import { frameworks } from 'components/Hero/HeroFrameworks'

import type { FeatureGridProps } from 'components/Solutions/FeatureGrid'
import type { PlatformSectionProps } from 'components/Solutions/PlatformSection'
import type { ResultsSectionProps } from 'components/Solutions/ResultsSection'
import type { SecuritySectionProps } from 'components/Enterprise/Security'
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
      logo?: React.ReactElement
      link?: string
    }
  }
  why: FeaturesSection
  platform: PlatformSectionProps
  developerExperience: ReturnType<typeof getSharedSections>['developerExperience']
  resultsSection: ResultsSectionProps
  featureGrid: FeatureGridProps
  securitySection: SecuritySectionProps
  ecosystemSection: FeaturesSection
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
      metaTitle: 'Supabase for Agents',
      metaDescription:
        'One platform for your agents. Memory, tools, and data in one place. Stop stitching together separate services.',
    },
    heroSection: {
      id: 'hero',
      title: 'Supabase for Agents',
      h1: (
        <>
          One platform for your agents.
          <br />
          <span className="text-foreground block">Memory, tools, and data in one place.</span>
        </>
      ),
      subheader: [
        <>
          Stop stitching together separate services for memory, vectors, auth, file storage, and
          APIs. Supabase gives your agents a complete Postgres backend with everything they need,
          from one dashboard, one connection string, one bill.
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
              properties: { buttonLocation: 'Solutions: Agents page hero' },
            }),
        },
        {
          label: 'Request a demo',
          href: 'https://supabase.com/contact/sales',
          type: 'default' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'request_demo_button_clicked',
              properties: { buttonLocation: 'Solutions: Agents page hero' },
            }),
        },
      ],
    },
    singleQuote: {
      id: 'social-proof',
      quote: {
        text: '"Supabase is great because it has everything. I don\'t need a different solution for authentication, a different solution for database, or a different solution for storage."',
        author: 'Yasser Elsaid',
        role: 'Founder, Chatbase',
        link: '/customers/chatbase',
        logo: (
          <Image
            src="/images/customers/logos/chatbase.png"
            alt="Chatbase"
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
          Why <span className="text-foreground">agent builders</span> choose Supabase
        </>
      ),
      subheading:
        'You need infrastructure that keeps up with agents that plan, act, and learn autonomously. Supabase is the complete Postgres developer platform built for agentic workloads.',
      features: [
        {
          id: 'one-platform',
          icon: CubeIcon,
          heading: 'One platform, not five.',
          subheading:
            'Most agent stacks require a vector database, an auth provider, a file store, an API layer, and a separate Postgres instance. Supabase replaces all of them. One connection string, one dashboard, one bill.',
        },
        {
          id: 'security-at-agent-speed',
          icon: Lock,
          heading: 'Security at agent speed.',
          subheading:
            'Agents make autonomous decisions with no human in the loop. Row Level Security ensures every database call respects tenant boundaries. Combined with SOC 2 Type II certification and database audit logs, your agent workloads stay secure at production scale.',
        },
        {
          id: 'native-mcp',
          icon: (props: any) => (
            <svg
              width="23"
              height="23"
              viewBox="0 0 25 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              {...props}
            >
              <path
                d="M19 5L22 2M2 22L5 19M7.5 13.5L10 11M10.5 16.5L13 14M6.3 20.3C6.52297 20.5237 6.78791 20.7013 7.07963 20.8224C7.37136 20.9435 7.68413 21.0059 8 21.0059C8.31587 21.0059 8.62864 20.9435 8.92036 20.8224C9.21209 20.7013 9.47703 20.5237 9.7 20.3L12 18L6 12L3.7 14.3C3.47626 14.523 3.29873 14.7879 3.17759 15.0796C3.05646 15.3714 2.99411 15.6841 2.99411 16C2.99411 16.3159 3.05646 16.6286 3.17759 16.9204C3.29873 17.2121 3.47626 17.477 3.7 17.7L6.3 20.3ZM12 6L18 12L20.3 9.7C20.5237 9.47703 20.7013 9.21209 20.8224 8.92036C20.9435 8.62864 21.0059 8.31587 21.0059 8C21.0059 7.68413 20.9435 7.37136 20.8224 7.07963C20.7013 6.78791 20.5237 6.52297 20.3 6.3L17.7 3.7C17.477 3.47626 17.2121 3.29873 16.9204 3.17759C16.6286 3.05646 16.3159 2.99411 16 2.99411C15.6841 2.99411 15.3714 3.05646 15.0796 3.17759C14.7879 3.29873 14.523 3.47626 14.3 3.7L12 6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          heading: 'Native MCP from day one.',
          subheading:
            'Supabase includes an MCP server that supports both read and write operations. Your agents can query schemas, insert records, and manage data through a standardized protocol.',
        },
      ],
    },
    platform: {
      ...shared.platform,
      title: (
        <>
          Supabase is the Postgres platform <span className="text-foreground">your agents control</span>
        </>
      ),
      subheading: 'Everything your agents need to connect, query, and act on your data.',
    },
    developerExperience: shared.developerExperience,
    resultsSection: shared.resultsSection,
    featureGrid: shared.featureGrid,
    securitySection: {
      id: 'security',
      label: 'Security',
      heading: (
        <>
          Trusted for <span className="text-foreground">agent workloads in production</span>
        </>
      ),
      subheading:
        'Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.',
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
    ecosystemSection: {
      id: 'ecosystem',
      label: '',
      heading: (
        <>
          Works with every <span className="text-foreground">agent framework</span>
        </>
      ),
      subheading: 'Supabase integrates with the tools and frameworks agent builders already use.',
      features: [
        {
          id: 'agent-frameworks',
          icon: CubeIcon,
          heading: 'Agent frameworks.',
          subheading:
            'LangChain and any framework that speaks SQL, REST, or MCP—including CrewAI, AutoGen, and others.',
        },
        {
          id: 'ai-providers',
          icon: Check,
          heading: 'AI providers.',
          subheading:
            'OpenAI, Anthropic, Google, Mistral, and any model provider. Supabase is model-agnostic.',
        },
        {
          id: 'development-tools',
          icon: Check,
          heading: 'Development tools.',
          subheading:
            'Cursor, Windsurf, VS Code Copilot, Claude Code, and every editor that supports MCP.',
        },
      ],
    },
    platformStarterSection: {
      id: 'quickstarts',
      heading: (
        <>
          <span className="text-foreground">Get started</span>
        </>
      ),
      subheading:
        'Copy these prompts into your AI editor to scaffold agent infrastructure on Supabase:',
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
          id: 'agent-memory',
          title: 'Build an agent memory store',
          code: 'Create a Supabase schema for persistent agent memory with session tracking, JSONB state storage, and vector embeddings for semantic recall.',
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'rag-pipeline',
          title: 'Set up a RAG pipeline',
          code: 'Build a RAG pipeline on Supabase with document upload to Storage, text extraction via Edge Functions, and pgvector embeddings with hybrid search.',
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'multi-tenant',
          title: 'Configure multi-tenant agent access',
          code: 'Design a multi-tenant Supabase schema with Row Level Security policies that restrict each agent to its own tenant\'s data.',
          language: 'markdown',
          copyable: true,
        },
        {
          id: 'tool-endpoint',
          title: 'Deploy a tool-calling endpoint',
          code: 'Create a Supabase Edge Function that serves as a tool endpoint for an AI agent, accepting structured input, querying the database, and returning formatted results.',
          language: 'markdown',
          copyable: true,
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
          name: 'Humata',
          logo: '/images/customers/logos/humata.png',
          highlights: ['AI-powered document analysis at scale'],
          cta: { label: 'Read the case study', href: '/customers/humata' },
        },
        {
          name: 'Chatbase',
          logo: '/images/customers/logos/chatbase.png',
          highlights: [
            'One of the most successful single-founder AI products',
            'Built entirely on Supabase',
          ],
          cta: { label: 'Read the case study', href: '/customers/chatbase' },
        },
        {
          name: 'Markprompt',
          logo: '/images/customers/logos/markprompt.png',
          highlights: ['GDPR-compliant AI chatbots on Supabase'],
          cta: { label: 'Read the case study', href: '/customers/markprompt' },
        },
      ],
    },
  }
}

export default data
