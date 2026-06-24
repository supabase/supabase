import { useLocalStorage } from '@uidotdev/usehooks'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { buildClickhouseRewritePrompt } from './Logs.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface LogsExplorerOtelBannerProps {
  projectRef: string
  sql: string
}

/**
 * Shown in the Logs Explorer when it runs against the ClickHouse-backed OTEL
 * endpoint, warning that the SQL dialect changed from BigQuery and offering the
 * AI Assistant to rewrite existing queries. Dismissal is persisted per project.
 */
export const LogsExplorerOtelBanner = ({ projectRef, sql }: LogsExplorerOtelBannerProps) => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const [dismissed, setDismissed] = useLocalStorage<boolean>(
    `logs-explorer-clickhouse-banner-dismissed-${projectRef}`,
    false
  )

  if (dismissed) return null

  const openRewriteAssistant = () => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    aiSnap.newChat({
      name: 'Rewrite logs query for ClickHouse',
      initialMessage: buildClickhouseRewritePrompt(sql),
    })
  }

  return (
    <Admonition
      type="warning"
      className="mb-0 rounded-none border-x-0 border-t-0"
      title="Logs now use ClickHouse SQL"
      description="This project's logs run on a new ClickHouse-backed engine, which uses a different SQL dialect than BigQuery. Existing saved queries may need to be rewritten."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="default" size="tiny" onClick={openRewriteAssistant}>
            Rewrite with AI Assistant
          </Button>
          <Button variant="text" size="tiny" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      }
    />
  )
}
