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
  showPreferredSource = false,
  className,
}: {
  pageType: MarkdownAffordancePageType
  articleId: string
  showAgentSetup?: boolean
  showPreferredSource?: boolean
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
    <section className={className} aria-labelledby="ai-tools-title">
      <h2
        id="ai-tools-title"
        className={cn(
          'mb-3',
          pageType === 'troubleshooting'
            ? 'text-sm text-foreground-lighter'
            : 'block font-mono uppercase text-xs text-foreground-light'
        )}
      >
        AI tools
      </h2>
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
        {showPreferredSource && (
          <a
            href="https://www.google.com/preferences/source?q=supabase.com"
            target="_blank"
            title="Add Supabase as a preferred source on Google"
            rel="noreferrer noopener"
            onClick={() => sendTelemetryEvent({ action: 'preferred_source_clicked' })}
            className="flex items-center gap-1.5 text-xs text-foreground-lighter hover:text-foreground transition-colors"
          >
            <svg
              viewBox="0 0 256 262"
              width={12}
              height={12}
              fill="currentColor"
              aria-hidden
              className="shrink-0"
            >
              <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
              <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
              <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" />
              <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
            </svg>
            Add as preferred
          </a>
        )}
      </div>
    </section>
  )
}

export { AiTools }
