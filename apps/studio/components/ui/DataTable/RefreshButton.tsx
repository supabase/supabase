import { LoaderCircle, RefreshCcw } from 'lucide-react'
import { ButtonTooltip } from '../ButtonTooltip'

interface RefreshButtonProps {
  isLoading: boolean
  onRefresh: () => void
}

export const RefreshButton = ({ isLoading, onRefresh }: RefreshButtonProps) => {
  return (
    <ButtonTooltip
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
      tooltip={{ content: { side: 'bottom', text: 'Refresh logs' } }}
    />
  )
}
