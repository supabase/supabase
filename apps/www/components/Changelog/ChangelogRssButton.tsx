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

/** Must stay in sync with CHANGELOG_PRODUCT_TAGS in apps/www/pages/changelog.tsx */
const PRODUCT_RSS_FEEDS = [
  { label: 'Database' },
  { label: 'Auth' },
  { label: 'Storage' },
  { label: 'Realtime' },
  { label: 'Edge Functions' },
  { label: 'postgres' },
  { label: 'PostgREST' },
  { label: 'AI & Vector' },
  { label: 'Billing' },
  { label: 'Breaking Change' },
  { label: 'CLI' },
  { label: 'Dashboard' },
  { label: 'Docs' },
  { label: 'Infra' },
  { label: 'Self-hosted' },
  { label: 'supabase-js' },
  { label: 'supabase-swift' },
  { label: 'supabase-flutter' },
  { label: 'supabase-py' },
] as const

function labelToFileSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function productFeedHref(label: string): string {
  return `/changelog-rss/${labelToFileSlug(label)}.xml`
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
          {PRODUCT_RSS_FEEDS.map(({ label }) => (
            <DropdownMenuItem key={label} asChild className="gap-2">
              <Link href={productFeedHref(label)}>
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
