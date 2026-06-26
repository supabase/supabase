import { useLocalStorage } from '@uidotdev/usehooks'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

interface LogsExplorerOtelBannerProps {
  projectRef: string
  isRewriting: boolean
  onRewrite: () => void
}

/**
 * Shown in the Logs Explorer when it runs against the ClickHouse-backed OTEL
 * endpoint, warning that the SQL dialect changed from BigQuery. The rewrite
 * action asks the assistant in the background and proposes the result as a diff
 * in the editor. Dismissal is persisted per project.
 */
export const LogsExplorerOtelBanner = ({
  projectRef,
  isRewriting,
  onRewrite,
}: LogsExplorerOtelBannerProps) => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>(
    `logs-explorer-clickhouse-banner-dismissed-${projectRef}`,
    false
  )

  if (dismissed) return null

  return (
    <Admonition
      type="warning"
      className="mb-0 rounded-none border-x-0 border-t-0"
      title="Logs now use ClickHouse SQL"
      description="This project's logs run on a new ClickHouse-backed engine, which uses a different SQL dialect than BigQuery. Existing saved queries may need to be rewritten."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="default" size="tiny" loading={isRewriting} onClick={onRewrite}>
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
