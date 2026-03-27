import { AlertCircle } from 'lucide-react'
import { Button } from 'ui'

interface DataTableErrorProps {
  error: Error
  onRetry?: () => void
}

export function DataTableError({ error, onRetry }: DataTableErrorProps) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <p className="text-sm font-medium text-foreground">Failed to load data</p>
        <p className="mt-1 text-xs text-foreground-lighter">{error.message}</p>
      </div>
      {onRetry && (
        <Button type="default" size="tiny" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}
