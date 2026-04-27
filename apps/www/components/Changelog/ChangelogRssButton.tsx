'use client'

import changelogProductTags from '~/data/changelog-product-tags.json'
import { ChevronDown, Rss } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from 'ui'

type Props = {
  className?: string
}

const PRODUCT_RSS_FEEDS = changelogProductTags.map(({ label }) => ({ label }))

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
        <DropdownMenuContent align="end" className="max-h-96 w-56 overflow-y-auto">
          <DropdownMenuLabel className="font-normal">
            Tag-based Changelog RSS feeds
          </DropdownMenuLabel>
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
