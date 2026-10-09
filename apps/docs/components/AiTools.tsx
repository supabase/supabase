'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { askAiUrls, useCopyMarkdownFromUrl } from 'common'
import { type MarkdownAffordancePageType } from 'common/telemetry-constants'
import { Chatgpt, Claude } from 'icons'
import { Check, Copy, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'

function AiTools({
  pageType,
  articleId,
  showAgentSetup = false,
  className,
}: {
  pageType: MarkdownAffordancePageType
  /** ID of the rendered article, copied as HTML when the page's markdown can't be fetched. */
  articleId: string
  showAgentSetup?: boolean
  className?: string
}) {
  const path = usePathname()
  const sendTelemetryEvent = useSendTelemetryEvent()
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()
  const urls = askAiUrls(`https://supabase.com/docs${path}`)

  function handleAgentSetupClick() {
    sendTelemetryEvent({ action: 'agent_setup_clicked' })
  }

  async function handleCopy() {
    const ok = await copyMarkdown(`/docs${path}.md`, {
      fallback: () => document.getElementById(articleId)?.innerHTML ?? '',
    })
    if (ok) {
      sendTelemetryEvent({ action: 'copy_as_markdown_clicked', properties: { pageType } })
    }
  }

  return (
    <section className={cn(className)} aria-labelledby="ai-tools-title">
      <h3
        id="ai-tools-title"
        className="block font-mono uppercase text-xs text-foreground-light mb-3"
      >
        AI Tools
      </h3>
      <div className="flex flex-col gap-2">
        {showAgentSetup && (
          <Link
            href="/guides/ai-tools"
            onClick={handleAgentSetupClick}
            className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors"
          >
            <Sparkles size={14} strokeWidth={1.5} />
            Connect your AI agent
          </Link>
        )}
        <button
          tabIndex={0}
          onClick={handleCopy}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground text-left transition-colors"
        >
          {copied ? (
            <Check size={14} strokeWidth={1.5} className="text-primary" aria-hidden />
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
          onClick={() =>
            sendTelemetryEvent({
              action: 'ask_ai_clicked',
              properties: { agent: 'chatgpt', pageType },
            })
          }
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors"
        >
          <Chatgpt size={14} aria-hidden />
          Ask ChatGPT
        </a>
        <a
          href={urls.claude}
          target="_blank"
          onClick={() =>
            sendTelemetryEvent({
              action: 'ask_ai_clicked',
              properties: { agent: 'claude', pageType },
            })
          }
          rel="noreferrer noopener"
          className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors"
        >
          <Claude size={14} aria-hidden />
          Ask Claude
        </a>
      </div>
    </section>
  )
}

export { AiTools }
