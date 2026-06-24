import { useLocalStorage } from '@uidotdev/usehooks'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { rewriteBqLogsSqlToClickhouse } from './logs-sql-rewrite'
import { buildClickhouseRewritePrompt } from './Logs.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

interface LogsExplorerOtelBannerProps {
  projectRef: string
  sql: string
  onApplyRewrite: (sql: string) => void
}

/**
 * Shown in the Logs Explorer when it runs against the ClickHouse-backed OTEL
 * endpoint, warning that the SQL dialect changed from BigQuery. The primary
 * action rewrites the current query to ClickHouse deterministically and falls
 * back to the AI Assistant when it can't. Dismissal is persisted per project.
 */
export const LogsExplorerOtelBanner = ({
  projectRef,
  sql,
  onApplyRewrite,
}: LogsExplorerOtelBannerProps) => {
  const { openSidebar } = useSidebarManagerSnapshot()
  const aiSnap = useAiAssistantStateSnapshot()
  const [isRewriting, setIsRewriting] = useState(false)
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

  const handleRewrite = async () => {
    if (!sql.trim()) {
      openRewriteAssistant()
      return
    }
    setIsRewriting(true)
    try {
      const { sql: rewritten, changed } = await rewriteBqLogsSqlToClickhouse(sql)
      if (changed) {
        onApplyRewrite(rewritten)
        toast.success('Rewrote the query for ClickHouse')
      } else {
        // Nothing to rewrite deterministically, let the assistant help.
        openRewriteAssistant()
      }
    } catch {
      toast.info("Couldn't rewrite automatically, opening the AI Assistant")
      openRewriteAssistant()
    } finally {
      setIsRewriting(false)
    }
  }

  return (
    <Admonition
      type="warning"
      className="mb-0 rounded-none border-x-0 border-t-0"
      title="Logs now use ClickHouse SQL"
      description="This project's logs run on a new ClickHouse-backed engine, which uses a different SQL dialect than BigQuery. Existing saved queries may need to be rewritten."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="default" size="tiny" loading={isRewriting} onClick={handleRewrite}>
            Rewrite to ClickHouse
          </Button>
          <Button variant="text" size="tiny" onClick={() => setDismissed(true)}>
            Dismiss
          </Button>
        </div>
      }
    />
  )
}
