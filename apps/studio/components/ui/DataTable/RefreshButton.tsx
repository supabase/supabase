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
      size="tiny"
      type="outline"
      disabled={isLoading}
      onClick={onClick}
      className="w-[26px]"
      icon={
        isLoading ? (
          <LoaderCircle className="text-foreground animate-spin" />
        ) : (
          <RefreshCcw className="text-foreground" />
        )
      }
    />
  )
}
