import type { GoPageInput } from 'marketing'
import Link from 'next/link'
import { Button } from 'ui'

type ThemeLink = {
  label: string
  href: string
}

type Theme = {
  name: string
  description: string
  product: ThemeLink
  feature: ThemeLink
}

const themes: Theme[] = [
  {
    name: 'Build',
    description: 'Ship your first Postgres-backed app fast.',
    product: { label: 'Database', href: '/database' },
    feature: { label: 'Auto-generated REST API', href: '/features/auto-generated-rest-api' },
  },
  {
    name: 'Scale',
    description: 'Grow without re-architecting your stack.',
    product: { label: 'Edge Functions', href: '/edge-functions' },
    feature: { label: 'Regional invocations', href: '/features/regional-invocations' },
  },
  {
    name: 'Operate',
    description: 'Run Supabase securely in production.',
    product: { label: 'Auth', href: '/auth' },
    feature: { label: 'Row Level Security', href: '/features/row-level-security' },
  },
]

const page: GoPageInput = {
  template: 'lead-gen',
  slug: 'ask-supabase-select',
  metadata: {
    title: 'Ask Supabase: Quick Product Links',
    description:
      'Quick links to Supabase products and features, organized by build, scale, and operate.',
  },
  hero: {
    title: 'Ask Supabase',
    subtitle: 'Quick links, organized by what you are trying to do',
    description:
      'Jump straight to the Supabase products and features that match where you are in your project, from building your first app to operating it in production.',
    ctas: [
      {
        label: 'Read the docs',
        href: '/docs',
        variant: 'secondary',
      },
    ],
  },
  sections: [
    {
      type: 'three-column',
      title: 'Find what you need',
      description:
        'Three themes, each with a product page, a feature page, and an upcoming blog post.',
      children: (
        <>
          {themes.map((theme) => (
            <div
              key={theme.name}
              className="flex flex-col gap-4 rounded-lg border border-muted p-6"
            >
              <div>
                <h3 className="text-lg text-foreground">{theme.name}</h3>
                <p className="text-sm text-foreground-lighter mt-1">{theme.description}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild size="small" className="justify-start">
                  <Link href={theme.product.href}>Product: {theme.product.label}</Link>
                </Button>
                <Button asChild size="small" className="justify-start">
                  <Link href={theme.feature.href}>Feature: {theme.feature.label}</Link>
                </Button>
                <span className="text-sm text-foreground-lighter px-1">Blog post: coming soon</span>
              </div>
            </div>
          ))}
        </>
      ),
    },
  ],
}

export default page
