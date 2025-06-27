import { LoaderCircle, RefreshCcw } from 'lucide-react'
import { Button } from 'ui'

interface RefreshButtonProps {
  isLoading: boolean
  onRefresh: () => void
}

export const RefreshButton = ({ isLoading, onRefresh }: RefreshButtonProps) => {
  return (
    <Button
      size="tiny"
      type="outline"
      disabled={isLoading}
      onClick={onRefresh}
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
