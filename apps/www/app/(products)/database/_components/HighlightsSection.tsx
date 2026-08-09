import SectionContainerWithCn from '~/components/Layouts/SectionContainerWithCn'
import { Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Button } from 'ui'

type Highlight = {
  title: string
  badge?: string
  features: string[]
  cta: { label: string; href: string }
  image: { dark: string; light: string }
}

const HIGHLIGHTS: Highlight[] = [
  {
    title: 'Branching',
    features: [
      'Branch your Supabase project',
      'Sync with your git branches',
      'Manage every Preview from the Dashboard',
      'Support for Vercel Previews',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/platform/branching' },
    image: {
      dark: '/images/product/database/branching.svg',
      light: '/images/product/database/branching-light.svg',
    },
  },
  {
    title: 'Read Replicas',
    features: [
      'Serve data closer to your users',
      'Provide data redundancy',
      'Run complex queries without affecting your primary database',
      'Distribute load across various databases',
    ],
    cta: { label: 'Learn more', href: '/docs/guides/platform/read-replicas' },
    image: {
      dark: '/images/product/database/read-replicas.svg',
      light: '/images/product/database/read-replicas-light.svg',
    },
  },
]

export function HighlightsSection() {
  return (
    <SectionContainerWithCn spacing="sections">
      {/* Header */}
      <h3 className="text-2xl md:text-4xl text-foreground-lighter max-w-xl">
        Built for scale
        <br />
        <span className="text-foreground">with powerful new features</span>
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {HIGHLIGHTS.map((highlight) => (
          <div
            key={highlight.title}
            className="relative flex flex-col overflow-hidden lg:min-h-[400px] bg-surface-75 border border-border rounded-lg"
          >
            <div className="relative z-10 flex flex-col justify-between h-full p-6 md:p-8 pr-0 md:pr-0">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-foreground text-lg font-medium">{highlight.title}</h4>
                  {highlight.badge && <Badge variant="success">{highlight.badge}</Badge>}
                </div>
                <ul className="flex flex-col text-foreground-lighter text-sm gap-1.5">
                  {highlight.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 stroke-2 text-brand" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6">
                <Button variant="default" size="small" asChild>
                  <Link href={highlight.cta.href}>{highlight.cta.label}</Link>
                </Button>
              </div>
            </div>
            {/* Decorative image */}
            <div
              className="hidden sm:flex lg:hidden xl:flex absolute top-0 right-0 bottom-0 items-end h-full opacity-50 dark:opacity-20 select-none"
              aria-hidden
            >
              <Image
                src={highlight.image.dark}
                alt=""
                width={296}
                height={275}
                className="hidden dark:block"
              />
              <Image
                src={highlight.image.light}
                alt=""
                width={296}
                height={275}
                className="dark:hidden"
              />
            </div>
          </div>
        ))}
      </div>
    </SectionContainerWithCn>
  )
}
