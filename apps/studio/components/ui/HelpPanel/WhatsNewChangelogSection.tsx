'use client'

import { Loader2, ScrollText } from 'lucide-react'
import Link from 'next/link'
import { cn, DropdownMenuItem, DropdownMenuLabel } from 'ui'

import { useChangelogRecentQuery } from '@/data/misc/changelog-recent-query'

const changelogLinkAfterClass = cn(
  'relative flex w-full gap-2 items-start',
  "after:pointer-events-none after:absolute after:left-[calc(0.5rem+7px)] after:top-[18px] after:z-0 after:block after:w-0 after:border-l after:border-dashed after:border-strong after:content-[''] after:h-[calc(100%-18px+6px)]"
)

function ChangelogRowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      fill="currentColor"
      className="relative z-[1] mt-0 shrink-0 text-foreground-lighter"
    >
      <circle cx="8" cy="8" r="3" />
    </svg>
  )
}

type WhatsNewChangelogSectionProps = {
  variant: 'dropdown' | 'inline'
  /** When false, the GitHub changelog query does not run (e.g. account menu closed). */
  fetchEnabled: boolean
}

export function WhatsNewChangelogSection({ variant, fetchEnabled }: WhatsNewChangelogSectionProps) {
  const { data: changelogRecent, isFetching } = useChangelogRecentQuery({ enabled: fetchEnabled })
  const isChangelogRecentLoading = isFetching && changelogRecent === undefined
  const items = changelogRecent?.items ?? []

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownMenuLabel className="text-xs text-foreground-lighter">
          What&apos;s new
        </DropdownMenuLabel>
        {isChangelogRecentLoading && (
          <DropdownMenuItem className="gap-2 cursor-default" disabled>
            <Loader2
              size={14}
              strokeWidth={1.5}
              className="text-foreground-lighter shrink-0 animate-spin"
            />
            <span className="text-foreground-light truncate">Loading updates…</span>
          </DropdownMenuItem>
        )}
        {!isChangelogRecentLoading &&
          items.map((item, index, arr) => (
            <DropdownMenuItem key={item.url} className="cursor-pointer items-start" asChild>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={changelogLinkAfterClass}
              >
                <ChangelogRowIcon />
                <span className="relative z-[1] text-left line-clamp-2">{item.title}</span>
              </a>
            </DropdownMenuItem>
          ))}
        <DropdownMenuItem className="flex gap-2 cursor-pointer" asChild>
          <Link href="https://supabase.com/changelog" target="_blank" rel="noopener noreferrer">
            <ScrollText size={14} strokeWidth={1.5} className="text-foreground-lighter" />
            View full changelog
          </Link>
        </DropdownMenuItem>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <h5 className="px-2 text-xs font-medium text-foreground-lighter">What&apos;s new</h5>
      <div className="flex flex-col">
        {isChangelogRecentLoading && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-foreground-light">
            <Loader2
              size={14}
              strokeWidth={1.5}
              className="shrink-0 animate-spin text-foreground-lighter"
            />
            Loading updates…
          </div>
        )}
        {!isChangelogRecentLoading &&
          items.map((item, index, arr) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                changelogLinkAfterClass,
                'rounded-sm px-2 py-1.5 text-xs text-foreground outline-none transition-colors hover:bg-overlay-hover focus-visible:bg-overlay-hover focus-visible:ring-1 focus-visible:ring-border-strong'
              )}
            >
              <ChangelogRowIcon />
              <span className="relative z-[1] text-left line-clamp-2">{item.title}</span>
            </a>
          ))}
        <a
          href="https://supabase.com/changelog"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-foreground outline-none transition-colors hover:bg-overlay-hover focus-visible:bg-overlay-hover focus-visible:ring-1 focus-visible:ring-border-strong"
        >
          <ScrollText size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          View full changelog
        </a>
      </div>
    </div>
  )
}
