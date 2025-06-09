import { LoaderCircle, RefreshCcw } from 'lucide-react'
import { Button } from 'ui'

import { useDataTable } from './providers/DataTableProvider'

interface RefreshButtonProps {
  onClick: () => void
}

export function RefreshButton({ onClick }: RefreshButtonProps) {
  const { isLoading } = useDataTable()

  return (
    <Button
      type="outline"
      size="small"
      disabled={isLoading}
      onClick={onClick}
      className="h-9 w-9 px-0"
    >
      {isLoading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}
    </Button>
  )
}
