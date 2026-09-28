import {
  BotIcon,
  Building2Icon,
  Code2Icon,
  Hammer,
  Maximize2,
  ShieldCheck,
  TrendingUpIcon,
} from 'lucide-react'
import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

type Theme = {
  name: string
  description: string
  cta: { label: string; href: string }
  icon: typeof Hammer
}

const themes: Theme[] = [
  {
    name: 'Build anything',
    description:
      "Your agent sets up the backend from code, your users' agents work with your app through its own MCP server, and long-running tasks run in Supabase Compute.",
    cta: { label: 'Read the Build Blog', href: '/docs' },
    icon: Hammer,
  },
  {
    name: 'Scale without limits',
    description:
      'The app your agent built in minutes stays on the same Postgres, from prototype to petabyte.',
    cta: { label: 'Read the Scale Blog', href: '/docs' },
    icon: Maximize2,
  },
  {
    name: 'Operate with confidence',
    description:
      'Your agent finds the problem, tests the fix, and reports what it found. You decide what ships.',
    cta: { label: 'Read the Operate Blog', href: '/docs' },
    icon: ShieldCheck,
  },
]

const solutions = [
  {
    name: 'AI Builders',
    description:
      'Ship AI-powered apps with a Postgres backend built for agents. Your users get one integrated backend, so you spend time building instead of managing infrastructure.',
    href: '/solutions/ai-builders',
    icon: BotIcon,
  },
  {
    name: 'Startups',
    description:
      'Move fast on a backend that scales with you. Spend your time on the product, not on managing infrastructure.',
    href: '/solutions/startups',
    icon: TrendingUpIcon,
  },
  {
    name: 'Developers',
    description:
      'Get everything you need to build a backend, in one place. Database, Auth, Storage, and Realtime all run on the same Postgres platform, so you write less glue code.',
    href: '/solutions/developers',
    icon: Code2Icon,
  },
  {
    name: 'Enterprise',
    description:
      'Run Supabase at scale with the security and support your team needs. Teams like GitHub and PwC trust Supabase to run their most important workloads.',
    href: '/solutions/enterprise',
    icon: Building2Icon,
  },
]

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'ask-supabase-select',
  metadata: {
    title: 'Ask Supabase: Select 2026 announcements',
    description:
      'Catch up on the product announcements from Supabase Select 2026, plus where to go next for your team.',
  },
  hero: {
    title: 'Build in an instant. Scale to infinity.',
    subtitle: 'Ask Supabase',
    description: 'Questions about what shipped?\nFind the Ask Supabase team on the show floor.',
    ctas: [
      {
        label: 'Read the Recap',
        href: '/docs',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'three-column',
      title: 'Our announcements',
      description: '20+ announcements, catch up on every single one.',
      children: (
        <>
          {themes.map((theme) => (
            <div
              key={theme.name}
              className="flex flex-col gap-6 rounded-lg border border-muted p-8"
            >
              <theme.icon className="h-6 w-6 stroke-brand-default" strokeWidth={1.5} />
              <h3 className="text-lg text-foreground">{theme.name}</h3>
              <p className="text-sm text-foreground-light">{theme.description}</p>
              <Button asChild size="small" variant="primary" className="self-center mt-auto">
                <Link href={theme.cta.href}>{theme.cta.label}</Link>
              </Button>
            </div>
          ))}
        </>
      ),
    },
    {
      type: 'two-column',
      title: 'Explore Supabase for your team',
      children: (
        <>
          {solutions.map((solution) => (
            <Link
              key={solution.name}
              href={solution.href}
              className="flex flex-col gap-2 rounded-lg border border-muted p-4 transition-colors hover:border-foreground-muted hover:bg-surface-100 active:bg-surface-200"
            >
              <solution.icon className="h-5 w-5 stroke-brand-default" strokeWidth={1.5} />
              <h3 className="text-base text-foreground">{solution.name}</h3>
              <p className="text-sm text-foreground-lighter">{solution.description}</p>
            </Link>
          ))}
        </>
      ),
    },
    {
      type: 'single-column',
      title: 'Supabase features',
      description: 'Everything you need to build and ship your next project.',
      children: (
        <div className="flex justify-center">
          <Button asChild size="medium" variant="primary">
            <Link href="/features">Explore all the latest features</Link>
          </Button>
        </div>
      ),
    },
  ],
}

export default page
