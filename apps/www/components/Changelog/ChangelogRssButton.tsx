'use client'

import { ChevronDown, Rss } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

type Props = {
  className?: string
}

/** GitHub changelog label slugs — dedicated per-product RSS URLs are placeholders until feeds ship. */
const PRODUCT_RSS_FEEDS = [
  { slug: 'database', label: 'Database' },
  { slug: 'auth', label: 'Auth' },
  { slug: 'storage', label: 'Storage' },
  { slug: 'realtime', label: 'Realtime' },
  { slug: 'vector', label: 'Vector' },
  { slug: 'edge-functions', label: 'Edge Functions' },
  { slug: 'billing', label: 'Billing' },
  { slug: 'cli', label: 'CLI' },
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'docs', label: 'Docs' },
  { slug: 'infra', label: 'Infra' },
  { slug: 'sdk', label: 'SDK' },
  { slug: 'self-hosted', label: 'Self-hosted' },
] as const

function productFeedHref(slug: (typeof PRODUCT_RSS_FEEDS)[number]['slug']) {
  return `/changelog-rss/${slug}.xml`
}

export function ChangelogRssButton({ className }: Props) {
  return (
    <div className={cn('flex items-center', className)}>
      <Button
        asChild
        type="default"
        className="rounded-r-none border-r-0"
        icon={<Rss className="h-4 w-4" strokeWidth={2} aria-hidden />}
      >
        <Link href="/changelog-rss.xml">Changelog RSS</Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="default"
            className="rounded-l-none px-1"
            icon={<ChevronDown className="h-4 w-4" strokeWidth={2} aria-hidden />}
            aria-label="Open product-specific changelog RSS feeds"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-100 w-52 overflow-y-auto">
          {PRODUCT_RSS_FEEDS.map(({ slug, label }) => (
            <DropdownMenuItem key={slug} asChild className="gap-2">
              <Link href={productFeedHref(slug)}>
                <Rss className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                {label} RSS
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
