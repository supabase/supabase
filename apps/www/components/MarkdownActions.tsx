'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { askAiUrls, useCopyMarkdownFromUrl } from 'common'
import type { MarkdownAffordancePageType } from 'common/telemetry-constants'
import { Chatgpt, Claude } from 'icons'
import { Check, Copy } from 'lucide-react'
import { cn } from 'ui'

import { SITE_ORIGIN } from '@/lib/constants'

type Props = {
  pagePath: string
  pageType: MarkdownAffordancePageType
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

const itemClass =
  'flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors'

export function MarkdownActions({
  pagePath,
  pageType,
  orientation = 'vertical',
  className,
}: Props) {
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const mdPath = pagePath === '/' ? '/index.md' : `${pagePath}.md`
  const urls = askAiUrls(`${SITE_ORIGIN}${pagePath === '/' ? '' : pagePath}`)

  async function handleCopy() {
    const ok = await copyMarkdown(mdPath)
    if (ok) {
      sendTelemetryEvent({ action: 'copy_as_markdown_clicked', properties: { pageType } })
    }
  }

  return (
    <div
      className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row flex-wrap items-center gap-4',
        className
      )}
    >
      <button
        tabIndex={0}
        type="button"
        onClick={handleCopy}
        className={cn(itemClass, 'cursor-pointer text-left')}
      >
        {copied ? (
          <Check size={14} strokeWidth={1.5} className="text-brand" aria-hidden />
        ) : (
          <Copy size={14} strokeWidth={1.5} aria-hidden />
        )}
        {copied ? 'Copied!' : 'Copy as Markdown'}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Copied to clipboard' : ''}
      </span>
      <a
        href={urls.chatgpt}
        target="_blank"
        rel="noreferrer noopener"
        onClick={() =>
          sendTelemetryEvent({
            action: 'ask_ai_clicked',
            properties: { agent: 'chatgpt', pageType },
          })
        }
        className={itemClass}
      >
        <Chatgpt size={14} aria-hidden />
        Ask ChatGPT
      </a>
      <a
        href={urls.claude}
        target="_blank"
        rel="noreferrer noopener"
        onClick={() =>
          sendTelemetryEvent({
            action: 'ask_ai_clicked',
            properties: { agent: 'claude', pageType },
          })
        }
        className={itemClass}
      >
        <Claude size={14} aria-hidden />
        Ask Claude
      </a>
    </div>
  )
}
