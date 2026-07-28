'use client'

import { useCopyMarkdownFromUrl } from 'common'
import { Chatgpt, Claude } from 'icons'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { cn } from 'ui'

import { ChangeTypeBadge, ProductBadges } from '@/components/Changelog/ChangelogTimelineList'
import type { ChangelogEntryFrontmatter } from '@/lib/changelog-repo'
import { SITE_ORIGIN } from '@/lib/constants'

type Props = {
  slug: string
  frontmatter: ChangelogEntryFrontmatter
  className?: string
}

export function ChangelogDetailSidebar({ slug, frontmatter, className }: Props) {
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()
  const mdPath = `/changelog/${slug}.md`
  const mdAbs = `${SITE_ORIGIN}${mdPath}`
  const aiPrompt = `Read from ${mdAbs} so I can ask questions about its contents`
  const affectedProducts = frontmatter.affected_products ?? []

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <section aria-labelledby="changelog-detail-type">
        <h2
          id="changelog-detail-type"
          className="text-foreground-light mb-2 font-mono text-xs uppercase tracking-wide"
        >
          Change type
        </h2>
        <ChangeTypeBadge type={frontmatter.change_type} />
      </section>

      <div className="border-default border-t" role="presentation" />

      {affectedProducts.length > 0 && (
        <>
          <section aria-labelledby="changelog-detail-tags">
            <h2
              id="changelog-detail-tags"
              className="text-foreground-light mb-2 font-mono text-xs uppercase tracking-wide"
            >
              Products
            </h2>
            <ProductBadges products={affectedProducts} onBadgeClick={(e) => e.stopPropagation()} />
          </section>
          <div className="border-default border-t" role="presentation" />
        </>
      )}

      {frontmatter.product_stage && (
        <>
          <section aria-labelledby="changelog-detail-stage">
            <h2
              id="changelog-detail-stage"
              className="text-foreground-light mb-2 font-mono text-xs uppercase tracking-wide"
            >
              Product stage
            </h2>
            <span className="text-foreground-light text-sm">{frontmatter.product_stage}</span>
          </section>
          <div className="border-default border-t" role="presentation" />
        </>
      )}

      {frontmatter.sunset_date && (
        <>
          <section aria-labelledby="changelog-detail-sunset">
            <h2
              id="changelog-detail-sunset"
              className="text-foreground-light mb-2 font-mono text-xs uppercase tracking-wide"
            >
              Sunset date
            </h2>
            <p className="text-foreground-lighter font-mono text-xs">{frontmatter.sunset_date}</p>
          </section>
          <div className="border-default border-t" role="presentation" />
        </>
      )}

      {frontmatter.affects_self_hosted != null && (
        <>
          <section aria-labelledby="changelog-detail-selfhosted">
            <h2
              id="changelog-detail-selfhosted"
              className="text-foreground-light mb-2 font-mono text-xs uppercase tracking-wide"
            >
              Self-hosted
            </h2>
            <span className="text-foreground-lighter font-mono text-xs">
              {frontmatter.affects_self_hosted ? 'Affected' : 'Not affected'}
            </span>
          </section>
          <div className="border-default border-t" role="presentation" />
        </>
      )}

      <section aria-labelledby="changelog-detail-links">
        <h2
          id="changelog-detail-links"
          className="text-foreground-light mb-2 font-mono text-xs uppercase tracking-wide"
        >
          Links
        </h2>
        <nav className="flex flex-col gap-2">
          {frontmatter.legacy_gh_discussion && (
            <a
              href={`https://github.com/supabase/supabase/discussions/${frontmatter.legacy_gh_discussion}`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-foreground-lighter hover:text-foreground flex items-center gap-1.5 text-xs transition-colors"
            >
              <ExternalLink size={14} strokeWidth={1.5} />
              View discussion on GitHub
            </a>
          )}
          <button
            tabIndex={0}
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
