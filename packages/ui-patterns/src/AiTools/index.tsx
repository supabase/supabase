'use client'

import { useCopyMarkdownFromUrl } from 'common/hooks/useCopyMarkdownFromUrl'
import { askAiUrls } from 'common/markdown-affordance'
import { Chatgpt, Claude, Google } from 'icons'
import { Check, Copy, Sparkles } from 'lucide-react'
import { useId } from 'react'
import { cn } from 'ui'

export type AiAgent = 'chatgpt' | 'claude'

export interface AiToolsProps {
  pageUrl: string
  markdownUrl: string
  markdownFallback?: () => string
  agentSetupHref?: string
  preferredSourceHref?: string
  onAgentSetupClick?: () => void
  onPreferredSourceClick?: () => void
  onMarkdownCopy?: () => void
  onAskAiClick?: (agent: AiAgent) => void
  titleClassName?: string
  className?: string
}

const ITEM_CLASS =
  'flex items-center gap-1.5 text-xs text-foreground-lighter transition-colors hover:text-foreground'

export const AiTools = ({
  pageUrl,
  markdownUrl,
  markdownFallback,
  agentSetupHref,
  preferredSourceHref,
  onAgentSetupClick,
  onPreferredSourceClick,
  onMarkdownCopy,
  onAskAiClick,
  titleClassName,
  className,
}: AiToolsProps) => {
  const { copied, copyMarkdown } = useCopyMarkdownFromUrl()
  const titleId = useId()
  const urls = askAiUrls(pageUrl)

  const handleCopy = async () => {
    const isCopied = await copyMarkdown(markdownUrl, { fallback: markdownFallback })
    if (isCopied) onMarkdownCopy?.()
  }
  const handleChatgptClick = () => onAskAiClick?.('chatgpt')
  const handleClaudeClick = () => onAskAiClick?.('claude')

  return (
    <section className={className} aria-labelledby={titleId}>
      <h2
        id={titleId}
        className={cn(
          'mb-3 block font-mono text-xs uppercase text-foreground-light',
          titleClassName
        )}
      >
        AI tools
      </h2>
      <div className="flex flex-col gap-2">
        {agentSetupHref ? (
          <a href={agentSetupHref} onClick={onAgentSetupClick} className={ITEM_CLASS}>
            <Sparkles aria-hidden className="size-3.5" strokeWidth={1.5} />
            Connect your AI agent
          </a>
        ) : null}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(ITEM_CLASS, 'cursor-pointer text-left')}
        >
          {copied ? (
            <Check aria-hidden className="size-3.5 text-primary" strokeWidth={1.5} />
          ) : (
            <Copy aria-hidden className="size-3.5" strokeWidth={1.5} />
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
          onClick={handleChatgptClick}
          className={ITEM_CLASS}
        >
          <Chatgpt aria-hidden className="size-3.5" />
          Ask ChatGPT
        </a>
        <a
          href={urls.claude}
          target="_blank"
          rel="noreferrer noopener"
          onClick={handleClaudeClick}
          className={ITEM_CLASS}
        >
          <Claude aria-hidden className="size-3.5" />
          Ask Claude
        </a>
        {preferredSourceHref ? (
          <a
            href={preferredSourceHref}
            target="_blank"
            title="Add Supabase as a preferred source on Google"
            rel="noreferrer noopener"
            onClick={onPreferredSourceClick}
            className={ITEM_CLASS}
          >
            <Google aria-hidden className="size-3.5" />
            Prefer on Google
          </a>
        ) : null}
      </div>
    </section>
  )
}
