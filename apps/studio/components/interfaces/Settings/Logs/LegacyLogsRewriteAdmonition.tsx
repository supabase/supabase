import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

interface LegacyLogsRewriteAdmonitionProps {
  isRewriting: boolean
  onRewrite: () => void
  onDismiss: () => void
}

/**
 * Presentation-only banner offering to rewrite a BigQuery-dialect logs query to
 * ClickHouse. Shared by the Logs Explorer and the SQL editor (whose
 * `LegacyLogsRewriteBanner` owns the detection and rewrite flow) so the copy
 * lives in one place.
 */
export const LegacyLogsRewriteAdmonition = ({
  isRewriting,
  onRewrite,
  onDismiss,
}: LegacyLogsRewriteAdmonitionProps) => {
  return (
    <Admonition
      type="default"
      layout="horizontal"
      className="mb-0 rounded-none border-x-0 border-t-0"
      title="Logs now run on a ClickHouse-backed engine"
      description="This query needs to be adjusted to ClickHouse SQL, which the Assistant can do for you."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="default" size="tiny" loading={isRewriting} onClick={onRewrite}>
            Rewrite with Assistant
          </Button>
          <Button variant="text" size="tiny" disabled={isRewriting} onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      }
    />
  )
}
