import { cn } from 'ui'
import { AiTools, type AiAgent } from 'ui-patterns/AiTools'
import { AnchorProvider, TocSection } from 'ui-patterns/Toc'
import type { TOCItemType } from 'ui-patterns/Toc/types'

import { sendKbTelemetryEvent } from '../lib/telemetry'

export interface GuideSidebarProps {
  items: TOCItemType[]
  pageUrl: string
  markdownUrl: string
  className?: string
}

const getArticleHtml = () => document.querySelector('article')?.innerHTML ?? ''

const handleAgentSetupClick = () => sendKbTelemetryEvent({ action: 'agent_setup_clicked' })

const handleMarkdownCopy = () =>
  sendKbTelemetryEvent({ action: 'copy_as_markdown_clicked', properties: { pageType: 'kb' } })

const handleAskAiClick = (agent: AiAgent) =>
  sendKbTelemetryEvent({ action: 'ask_ai_clicked', properties: { agent, pageType: 'kb' } })

export const GuideSidebar = ({ items, pageUrl, markdownUrl, className }: GuideSidebarProps) => (
  <AnchorProvider toc={items} single={false}>
    <div className={cn('flex flex-col gap-8 border-l px-2', className)}>
      <AiTools
        pageUrl={pageUrl}
        markdownUrl={markdownUrl}
        markdownFallback={getArticleHtml}
        agentSetupHref="https://supabase.com/docs/guides/ai-tools"
        onAgentSetupClick={handleAgentSetupClick}
        onMarkdownCopy={handleMarkdownCopy}
        onAskAiClick={handleAskAiClick}
        className="pl-5"
      />
      {items.length > 0 ? <TocSection items={items} /> : null}
    </div>
  </AnchorProvider>
)
