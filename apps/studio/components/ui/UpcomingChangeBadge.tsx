import { Megaphone } from 'lucide-react'
import { Badge } from 'ui'

interface UpcomingChangeBadgeProps {
  title: string
}

export const UpcomingChangeBadge = ({ title }: UpcomingChangeBadgeProps) => {
  return (
    <div className="flex flex-row items-center -space-x-px">
      <Badge
        variant="default"
        className="rounded-r-none pr-2 flex-shrink-0 gap-1.5 border-dashed bg-opacity-0 bg-surface-400 text-foreground-lighter"
      >
        <Megaphone size={16} strokeWidth={1.2} />
        Upcoming change
      </Badge>
      <Badge
        variant="default"
        className="rounded-l-none flex-shrink-0 gap-1.5 bg-opacity-0 bg-surface-400 text-foreground-lighter border-l-0"
      >
        <span className="text-foreground text-xs">{title}</span>
      </Badge>
    </div>
  )
}
