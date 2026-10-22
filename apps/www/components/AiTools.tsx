'use client'

import { useSendTelemetryEvent } from '~/lib/telemetry'
import type { MarkdownAffordancePageType } from 'common/telemetry-constants'
import { AiTools as SharedAiTools, type AiAgent, type AiToolsProps } from 'ui-patterns/AiTools'

import { SITE_ORIGIN } from '@/lib/constants'

type Props = {
  pagePath: string
  pageType: MarkdownAffordancePageType
  showPreferredSource?: boolean
} & Pick<AiToolsProps, 'orientation' | 'titleClassName' | 'className'>

export function AiTools({
  pagePath,
  pageType,
  showPreferredSource = false,
  orientation,
  titleClassName,
  className,
}: Props) {
  const sendTelemetryEvent = useSendTelemetryEvent()

  function handleMarkdownCopy() {
    sendTelemetryEvent({ action: 'copy_as_markdown_clicked', properties: { pageType } })
  }

  function handlePreferredSourceClick() {
    sendTelemetryEvent({ action: 'preferred_source_clicked', properties: { pageType } })
  }

  function handleAskAiClick(agent: AiAgent) {
    sendTelemetryEvent({ action: 'ask_ai_clicked', properties: { agent, pageType } })
  }

  return (
    <SharedAiTools
      pageUrl={`${SITE_ORIGIN}${pagePath === '/' ? '' : pagePath}`}
      markdownUrl={pagePath === '/' ? '/index.md' : `${pagePath}.md`}
      preferredSourceHref={
        showPreferredSource ? 'https://www.google.com/preferences/source?q=supabase.com' : undefined
      }
      onPreferredSourceClick={handlePreferredSourceClick}
      onMarkdownCopy={handleMarkdownCopy}
      onAskAiClick={handleAskAiClick}
      orientation={orientation}
      titleClassName={titleClassName}
      className={className}
    />
  )
}
