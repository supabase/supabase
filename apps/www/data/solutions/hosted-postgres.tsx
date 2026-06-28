import { useBreakpoint } from 'common'
import {
  Activity,
  Blocks,
  Bot,
  Cable,
  CalendarClock,
  Code2,
  Database,
  DatabaseBackup,
  GitBranch,
  GitFork,
  Globe,
  HardDrive,
  HeartPulse,
  History,
  KeyRound,
  LayoutDashboard,
  Lightbulb,
  List,
  ListOrdered,
  Lock,
  LockKeyhole,
  Network,
  Scaling,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Table2,
  Users,
  UserX,
  Wallet,
  Webhook,
  Workflow,
} from 'lucide-react'

import { FrameworkLink, getEditors, type HeroSection, type Metadata } from './solutions.utils'
import type { SecuritySectionProps } from '@/components/Enterprise/Security'
import { frameworks } from '@/components/Hero/HeroFrameworks'
import Logos from '@/components/logos'
import type { CtaSectionProps } from '@/components/Solutions/CtaSection'
import type { FeatureGridProps } from '@/components/Solutions/FeatureGrid'
import type { MPCSectionProps } from '@/components/Solutions/MPCSection'
import type { PricingComparisonSectionProps } from '@/components/Solutions/PricingComparisonSection'
import type { ResultsSectionProps } from '@/components/Solutions/ResultsSection'
import { TwoColumnsSectionProps } from '@/components/Solutions/TwoColumnsSection'
import { companyStats } from '@/data/company-stats'
import type { FeaturesSection } from '@/data/solutions/solutions.utils'
import { useSendTelemetryEvent } from '@/lib/telemetry'

const TELEMETRY_LOCATION = 'Solutions: Hosted Postgres page'

const data: () => {
  metadata: Metadata
  heroSection: HeroSection
  why: FeaturesSection
  pricing: PricingComparisonSectionProps
  included: FeatureGridProps
  bundled: FeatureGridProps
  resultsSection: ResultsSectionProps
  performanceGrid: FeatureGridProps
  securitySection: SecuritySectionProps
  platformUpsell: CtaSectionProps
  platformStarterSection: TwoColumnsSectionProps
  mcp: MPCSectionProps
} = () => {
  const isXs = useBreakpoint(640)
  const editors = getEditors(isXs)
  const sendTelemetryEvent = useSendTelemetryEvent()

  return {
    metadata: {
      metaTitle: 'Hosted Postgres | Supabase',
      metaDescription:
        'A managed Postgres database in seconds, free to start and just $25 a month in production. Plus a dashboard, backups, Point-in-Time Recovery, connection pooling, read replicas, and the full Postgres extension ecosystem.',
    },
    heroSection: {
      id: 'hero',
      title: 'Hosted Postgres',
      h1: <>Managed Postgres in seconds.</>,
      subheader: [
        <>
          Free to start, just $25 a month in production. More than a database: backups, logs,
          advisors, connection pooling, APIs, and everything you need to run Postgres in production.
          The rest of the platform is ready when you need it.
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
              properties: { buttonLocation: `${TELEMETRY_LOCATION} hero` },
            }),
        },
        {
          label: 'Request a demo',
          href: 'https://supabase.com/contact/sales',
          type: 'default' as any,
          onClick: () =>
            sendTelemetryEvent({
              action: 'request_demo_button_clicked',
              properties: { buttonLocation: `${TELEMETRY_LOCATION} hero` },
            }),
        },
      ],
      footer: (
        <div className="flex flex-col items-center gap-6 mt-8">
          <p className="text-center text-foreground-light">
            Postgres is trusted in production by teams of every size
          </p>
          <Logos showHeading={false} className="pb-0!" />
          <p className="text-center text-sm text-foreground-lighter">
            {companyStats.databasesManaged.text} databases created and{' '}
            {companyStats.developersRegistered.text} developers on Supabase
          </p>
        </div>
      ),
    },
    why: {
      id: 'why-supabase',
      label: '',
      heading: (
        <>
          Why developers choose Supabase for{' '}
          <span className="text-foreground">hosted Postgres</span>
        </>
      ),
      subheading:
        'You came for a Postgres database. You get a fully managed one, plus the tools you would otherwise build or buy. Pure Postgres, no lock-in.',
      features: [
        {
          id: 'real-postgres',
          icon: Database,
          heading: 'Real Postgres, fully managed',
          subheading:
            'Connect with psql, pgAdmin, or any standard client. Use native extensions and Row Level Security. We handle provisioning, patching, backups, and uptime.',
        },
        {
          id: 'free-to-start',
          icon: Wallet,
          heading: 'Free to start, $25 when you need more',
          subheading:
            'Launch a database for free in seconds. Upgrade to Pro for daily backups, email support, and additional production features.',
        },
        {
          id: 'more-than-a-database',
          icon: LayoutDashboard,
          heading: 'More than a database, from day one',
          subheading:
            'Every project ships with a Dashboard, a SQL Editor, a Table Editor, logs, performance and security advisors, and auto-generated APIs.',
        },
        {
          id: 'built-to-scale',
          icon: Scaling,
          heading: 'Built to scale, dependable under pressure',
          subheading:
            'Read replicas, point-in-time recovery, and high availability when you need them.',
        },
      ],
    },
    pricing: {
      id: 'pricing',
      heading: (
        <>
          Pay for Postgres, <span className="text-foreground">not for surprises</span>
        </>
      ),
      subheading:
        'Most hosted Postgres plans start cheap and stay just okay. Supabase is free to start and $25 a month for a production database, with no charges for reads or writes and no per-connection fees. Here is what is included at each tier.',
      plans: [{ name: 'Free' }, { name: 'Pro', highlight: true }],
      rows: [
        { feature: 'Monthly price', values: ['$0', '$25'] },
        { feature: 'Dedicated Postgres database', values: [true, true] },
        { feature: 'Dashboard, SQL editor, table editor', values: [true, true] },
        { feature: 'Auto-generated REST and GraphQL APIs', values: [true, true] },
        {
          feature: 'Full extension ecosystem (pgvector, PostGIS, and more)',
          values: [true, true],
        },
        { feature: 'Connection pooling', values: [true, true] },
        { feature: 'Charges per read or write', values: ['Never', 'Never'] },
        { feature: 'Automatic daily backups', values: [false, '7-day retention'] },
        { feature: 'Point-in-Time Recovery', values: [false, 'Add-on'] },
        { feature: 'Read replicas', values: [false, 'Add-on'] },
        { feature: 'Database branching', values: [false, 'Usage-based'] },
        { feature: 'Projects never pause', values: [false, true] },
        { feature: 'Email support', values: ['Community', true] },
      ],
      cta: {
        label: 'See full pricing',
        url: '/pricing',
      },
    },
    included: {
      id: 'included',
      heading: 'More than a database',
      subheading:
        'Backups, connection pooling, branching, observability, point-in-time recovery, and developer tools included from day one.',
      features: [
        {
          id: 'managed-postgres',
          title: 'Fully managed Postgres',
          description:
            'A dedicated Postgres instance, provisioned in seconds and kept patched and online.',
          icon: Database,
        },
        {
          id: 'studio-dashboard',
          title: 'Studio dashboard',
          description:
            'Manage your database from a clean UI: browse data, inspect schema, and run queries from anywhere.',
          icon: LayoutDashboard,
        },
        {
          id: 'table-editor',
          title: 'Table editor',
          description:
            'A spreadsheet-style view to create, edit, and explore tables without writing SQL.',
          icon: Table2,
        },
        {
          id: 'sql-editor',
          title: 'SQL editor',
          description:
            'Write and run SQL in the browser, save snippets, and share queries with your team.',
          icon: SquareTerminal,
        },
        {
          id: 'automatic-backups',
          title: 'Automatic backups',
          description:
            'Daily backups with retention, so a bad migration is never the end of the world.',
          icon: DatabaseBackup,
        },
        {
          id: 'pitr',
          title: 'Point-in-Time Recovery',
          description: 'Restore to any moment, down to the second, for true disaster recovery.',
          icon: History,
        },
        {
          id: 'connection-pooling',
          title: 'Connection pooling',
          description:
            'Supavisor pools and shares connections so your app scales past Postgres connection limits.',
          icon: Network,
        },
        {
          id: 'read-replicas',
          title: 'Read replicas',
          description:
            'Add read-only databases in other regions to spread load and cut latency for global users.',
          icon: GitFork,
        },
        {
          id: 'branching',
          title: 'Branching',
          description:
            'Spin up isolated database branches for development and preview, then merge with confidence.',
          icon: GitBranch,
        },
        {
          id: 'migrations-cli',
          title: 'Migrations and CLI',
          description: (
            <>
              Version-control your schema and run the full stack locally with{' '}
              <code className="text-xs">supabase start</code>.
            </>
          ),
          icon: SquareTerminal,
        },
        {
          id: 'full-sql-access',
          title: 'Full SQL access',
          description:
            'CTEs, triggers, foreign keys, JSONB, full-text search, stored procedures, and PL/pgSQL.',
          icon: Code2,
        },
        {
          id: 'extension-ecosystem',
          title: 'The Postgres extension ecosystem',
          description:
            'pgvector, PostGIS, pg_cron, pg_stat_statements, and dozens more, one click away.',
          icon: Blocks,
        },
      ],
    },
    bundled: {
      id: 'bundled',
      heading: 'Your database is an application platform',
      subheading:
        'Generate APIs, schedule work, trigger workflows, manage secrets, and connect external systems without leaving Postgres.',
      features: [
        {
          id: 'rest-apis',
          title: 'Auto-generated REST APIs',
          description:
            'PostgREST turns your schema into a REST API instantly, ready for any framework.',
          icon: Webhook,
        },
        {
          id: 'graphql',
          title: 'GraphQL',
          description: 'pg_graphql reflects a GraphQL API straight from your database schema.',
          icon: Workflow,
        },
        {
          id: 'observability',
          title: 'Observability and logs',
          description: 'Built-in logs, reports, and query performance tools for fast debugging.',
          icon: Activity,
        },
        {
          id: 'advisors',
          title: 'Performance and Security Advisors',
          description:
            'Automatic checks that flag missing indexes, slow queries, and risky access policies before they bite.',
          icon: Lightbulb,
        },
        {
          id: 'cron',
          title: 'Cron',
          description:
            'Schedule recurring jobs with cron syntax, managed inside Postgres with pg_cron.',
          icon: CalendarClock,
        },
        {
          id: 'queues',
          title: 'Queues',
          description:
            'A Postgres-native durable message queue with guaranteed delivery, powered by pgmq.',
          icon: ListOrdered,
        },
        {
          id: 'vault',
          title: 'Vault',
          description: 'Store secrets and encryption keys securely, right in your database.',
          icon: KeyRound,
        },
        {
          id: 'fdw',
          title: 'Foreign Data Wrappers',
          description:
            'Query BigQuery, Redshift, MySQL, and external APIs as if they were local tables.',
          icon: Cable,
        },
        {
          id: 'database-webhooks',
          title: 'Database webhooks',
          description:
            'Trigger functions and external services automatically when your data changes.',
          icon: Webhook,
        },
        {
          id: 'mcp-server',
          title: 'MCP Server and AI Assistant',
          description: 'Connect Cursor, Claude, and other AI tools directly to your database.',
          icon: Bot,
        },
      ],
    },
    resultsSection: {
      id: 'performance',
      heading: (
        <>
          Top performance,
          <br />
          at any scale
        </>
      ),
      subheading:
        'Supabase is Postgres, so the ceiling is Postgres. Scale compute and storage independently, add replicas, and keep query times low whether you are handling a launch spike or steady growth. You will not outgrow it and need to start over somewhere else.',
      highlights: [
        {
          heading: companyStats.databasesManaged.label,
          subheading: companyStats.databasesManaged.text,
        },
        {
          heading: 'Postgres performance gains',
          subheading: '20-30x',
        },
      ],
    },
    performanceGrid: {
      id: 'performance-features',
      features: [
        {
          id: 'postgres-core',
          title: 'Postgres at its core',
          description:
            'ACID-compliant and battle-tested, trusted by startups and enterprises alike.',
          icon: Database,
        },
        {
          id: 'scaling',
          title: 'Vertical and horizontal scaling',
          description: 'Scale compute and storage independently, with support for read replicas.',
          icon: Scaling,
        },
        {
          id: 'high-performance-disk',
          title: 'High-performance disk',
          description: 'Fast, configurable storage tuned for demanding workloads.',
          icon: HardDrive,
        },
        {
          id: 'multi-region',
          title: 'Multi-region deployments',
          description:
            'Place read replicas close to your users for global availability and low latency.',
          icon: Globe,
        },
        {
          id: 'high-availability',
          title: 'High availability',
          description: 'Automatic failover and redundancy for mission-critical applications.',
          icon: ShieldCheck,
        },
        {
          id: 'pitr-backups',
          title: 'Point-in-Time Recovery and automatic backups',
          description: 'Recover quickly from any failure or mistake.',
          icon: DatabaseBackup,
        },
        {
          id: 'multigres',
          title: 'Multigres is coming',
          description: (
            <>
              Learn more about{' '}
              <a
                href="https://www.multigres.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline hover:text-brand transition-colors"
              >
                Multigres
              </a>{' '}
              and the performance benefits you&apos;ll get when it ships.
            </>
          ),
          icon: Sparkles,
        },
      ],
    },
    securitySection: {
      id: 'security',
      label: 'Security',
      heading:
        'Postgres is trusted for medical records, missions to the moon, and everything in between',
      subheading:
        'Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.',
      features: [
        {
          icon: ShieldCheck,
          heading: 'SOC 2 Type II certified',
        },
        {
          icon: HeartPulse,
          heading: 'HIPAA compliant',
        },
        {
          icon: Lock,
          heading: 'Encryption at rest and in transit',
        },
        {
          icon: LockKeyhole,
          heading: 'SSL enforcement',
        },
        {
          icon: UserX,
          heading: 'Network restrictions',
        },
        {
          icon: Users,
          heading: 'Row Level Security and Role-Based Access Control',
        },
        {
          icon: List,
          heading: 'Database audit logs',
        },
        {
          icon: Lightbulb,
          heading: 'Security Advisors',
        },
        {
          icon: KeyRound,
          heading: 'Multi-factor authentication',
        },
        {
          icon: ShieldAlert,
          heading: 'DDoS protection and vulnerability management',
        },
      ],
      cta: {
        label: 'Learn about security',
        url: '/security',
      },
    },
    platformUpsell: {
      id: 'platform-upsell',
      title: <>Postgres now. The rest of the backend when you want it.</>,
      subtitle:
        'Your hosted Postgres comes from the same platform that gives you Auth, Storage, Edge Functions, Realtime, and Vector search. Start with the database. Add the rest later without migrating, re-architecting, or changing vendors.',
      primaryCta: {
        label: 'Explore the full platform',
        url: '/',
      },
    },
    platformStarterSection: {
      id: 'platform-starter',
      heading: (
        <>
          <span className="text-foreground block">Choose your platform</span> to get started in
          seconds
        </>
      ),
      headingRight: (
        <>
          Or, start with <span className="text-foreground">Supabase AI Prompts</span>{' '}
          <Sparkles size={24} className="inline text-foreground" />
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
          description:
            '## Overview of implementing Supabase Auth SSR\n1. Install @supabase/supabase-js and...',
          code: `1. Install @supabase/supabase-js and @supabase/ssr packages.
2. Set up environment variables.
3. Write two utility functions with \u0060createClient\u0060 functions to create a browser client and a server client.
4. Hook up middleware to refresh auth tokens
`,
          language: 'markdown',
          docsUrl:
            'https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth',
        },
        {
          id: 'edge-functions',
          title: 'Writing Supabase Edge Functions',
          description:
            "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
          code: `1. Try to use Web APIs and Deno's core APIs instead of external dependencies (eg: use fetch instead of Axios, use WebSockets API instead of node-ws)
2. If you are reusing utility methods between Edge Functions, add them to 'supabase/functions/_shared' and import using a relative path. Do NOT have cross dependencies between Edge Functions.
3. Do NOT use bare specifiers when importing dependecnies. If you need to use an external dependency, make sure it's prefixed with either 'npm:' or 'jsr:'.
`,
          language: 'markdown',
          docsUrl: 'https://supabase.com/docs/guides/getting-started/ai-prompts/edge-functions',
        },
        {
          id: 'declarative-db-schema',
          title: 'Declarative Database Schema',
          description:
            "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
          code: `Mandatory Instructions for Supabase Declarative Schema Management
## 1. **Exclusive Use of Declarative Schema**
-**All database schema modifications must be defined within '.sql' files located in the 'supabase/schemas/' directory.`,
          language: 'markdown',
          docsUrl:
            'https://supabase.com/docs/guides/getting-started/ai-prompts/declarative-database-schema',
        },
        {
          id: 'rls-policies',
          title: 'Create RLS policies',
          description:
            "You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate...",
          code: `You're a Supabase Postgres expert in writing row level security policies. Your purpose is to generate a policy with the constraints given by the user. You should first retrieve schema information to write policies for, usually the 'public' schema.
The output should use the following instructions:

- The generated SQL must be valid SQL.`,
          language: 'markdown',
          docsUrl:
            'https://supabase.com/docs/guides/getting-started/ai-prompts/database-rls-policies',
        },
      ],
    },
    mcp: {
      id: 'mcp',
      heading: (
        <div className="text-foreground-lighter">
          Supabase works seamlessly with{' '}
          <span className="text-foreground">your favorite AI code editor</span>
        </div>
      ),
      ctaLabel: 'Connect your AI tools',
      documentationLink: '/docs/guides/getting-started/mcp',
      frameworks: editors,
      apiExamples: [
        {
          lang: 'json',
          title: 'macOS',
          code: `{
"mcpServers": {
  "supabase": {
    "command": "npx",
    "args": [
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=<project-ref>"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
    }
  }
}
}`,
        },
        {
          lang: 'json',
          title: 'Windows',
          code: `{
"mcpServers": {
  "supabase": {
    "command": "cmd",
    "args": [
      "/c",
      "npx",
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=<project-ref>"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
    }
  }
}
}`,
        },
        {
          lang: 'json',
          title: 'Windows (WSL)',
          code: `{
"mcpServers": {
  "supabase": {
    "command": "wsl",
    "args": [
      "npx",
      "-y",
      "@supabase/mcp-server-supabase@latest",
      "--read-only",
      "--project-ref=<project-ref>"
    ],
    "env": {
      "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
    }
  }
}
}`,
        },
        {
          lang: 'json',
          title: 'Linux',
          code: `{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=<project-ref>"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
      }
    }
  }
}`,
        },
      ],
    },
  }
}

export default data
