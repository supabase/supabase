import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

interface LogsExplorerOtelBannerProps {
  isRewriting: boolean
  onRewrite: () => void
  onDismiss: () => void
}

export const LogsExplorerOtelBanner = ({
  isRewriting,
  onRewrite,
  onDismiss,
}: LogsExplorerOtelBannerProps) => {
  return (
    <Admonition
      type="warning"
      className="mb-0 rounded-none border-x-0 border-t-0"
      title="Logs now run on a ClickHouse-backed engine"
      description="You can use AI to rewrite this query to ClickHouse SQL."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="default" size="tiny" loading={isRewriting} onClick={onRewrite}>
            Rewrite to ClickHouse
          </Button>
          <Button variant="text" size="tiny" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      }
    />
  )
}
