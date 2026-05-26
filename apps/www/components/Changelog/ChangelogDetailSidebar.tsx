'use client'

import { useCopyMarkdownFromUrl } from 'common'
import { Chatgpt, Claude } from 'icons'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { cn } from 'ui'

import { LabelBadges } from '@/components/Changelog/ChangelogTimelineList'
import type { ChangelogLabel } from '@/lib/changelog-github'
import { SITE_ORIGIN } from '@/lib/constants'

type Props = {
  slug: string
  url: string
  labels: ChangelogLabel[]
  className?: string
}

export function ChangelogDetailSidebar({ slug, url, labels, className }: Props) {
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()
  const mdPath = `/changelog/${slug}.md`
  const mdAbs = `${SITE_ORIGIN}${mdPath}`
  const aiPrompt = `Read from ${mdAbs} so I can ask questions about its contents`

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {labels.length > 0 && (
        <>
          <section aria-labelledby="changelog-detail-tags">
            <h2
              id="changelog-detail-tags"
              className="text-foreground-light mb-3 font-mono text-xs uppercase tracking-wide"
            >
              Tags
            </h2>
            <LabelBadges labels={labels} onBadgeClick={(e) => e.stopPropagation()} />
          </section>
          <div className="border-default border-t" role="presentation" />
        </>
      )}

      <section aria-labelledby="changelog-detail-links">
        <h2
          id="changelog-detail-links"
          className="text-foreground-light mb-3 font-mono text-xs uppercase tracking-wide"
        >
          Links
        </h2>
        <nav className="flex flex-col gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground-lighter hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
          >
            <ExternalLink size={14} strokeWidth={1.5} />
            View discussion on GitHub
          </a>
          <button
            type="button"
            onClick={() => void copyMarkdown(mdPath)}
            className="text-foreground-lighter hover:text-foreground flex items-center gap-1.5 text-left text-xs transition-colors"
          >
            {copied ? (
              <Check size={14} strokeWidth={1.5} className="text-brand" />
            ) : (
              <Copy size={14} strokeWidth={1.5} />
            )}
            {copied ? 'Copied as markdown' : 'Copy page as markdown'}
          </button>
          <a
            href={`https://chatgpt.com/?hint=search&q=${encodeURIComponent(`Read from ${mdAbs} so I can ask questions about its contents`)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground-lighter hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
          >
            <Chatgpt size={14} />
            Ask ChatGPT
          </a>
          <a
            href={`https://claude.ai/new?q=${encodeURIComponent(aiPrompt)}`}
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground-lighter hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
          >
            <Claude size={14} />
            Ask Claude
          </a>
        </nav>
      </section>
    </div>
  )
}
