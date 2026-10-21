'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import { type MarkdownAffordancePageType } from 'common/telemetry-constants'
import { usePathname } from 'next/navigation'
import { AiTools as SharedAiTools, type AiAgent } from 'ui-patterns/AiTools'

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

  function handleAgentSetupClick() {
    sendTelemetryEvent({ action: 'agent_setup_clicked' })
  }

  function handleMarkdownCopy() {
    sendTelemetryEvent({ action: 'copy_as_markdown_clicked', properties: { pageType } })
  }

  function handlePreferredSourceClick() {
    sendTelemetryEvent({ action: 'preferred_source_clicked', properties: { pageType } })
  }

  function handleAskAiClick(agent: AiAgent) {
    sendTelemetryEvent({ action: 'ask_ai_clicked', properties: { agent, pageType } })
  }

  function getArticleHtml() {
    return document.getElementById(articleId)?.innerHTML ?? ''
  }

  return (
    <SharedAiTools
      pageUrl={`https://supabase.com/docs${path}`}
      markdownUrl={`/docs${path}.md`}
      markdownFallback={getArticleHtml}
      agentSetupHref={showAgentSetup ? '/docs/guides/ai-tools' : undefined}
      preferredSourceHref={
        showPreferredSource ? 'https://www.google.com/preferences/source?q=supabase.com' : undefined
      }
      onAgentSetupClick={handleAgentSetupClick}
      onPreferredSourceClick={handlePreferredSourceClick}
      onMarkdownCopy={handleMarkdownCopy}
      onAskAiClick={handleAskAiClick}
      titleClassName={
        pageType === 'troubleshooting'
          ? 'font-sans text-sm normal-case text-foreground-lighter'
          : undefined
      }
      className={className}
    />
  )
}

export { AiTools }
