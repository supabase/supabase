import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

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
          <Button variant="text" size="tiny" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      }
    />
  )
}
