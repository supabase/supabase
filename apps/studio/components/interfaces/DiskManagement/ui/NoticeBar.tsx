import { Card, CardContent } from 'ui'
import { formatComputeName } from '../DiskManagement.utils'
import { LucideIcon } from 'lucide-react'

interface NoticeBarProps {
  title?: string
  description?: string
  icon?: LucideIcon
}

export function NoticeBar({
  title = 'Project about to restart',
  description = `This project is about to restart to change compute to.`,
  icon: Icon,
}: NoticeBarProps) {
  return (
    <Card
      // TO DO: wrap component into pattern
      className="px-2 bg-surface-100"
    >
      <CardContent className="py-3 flex gap-3 px-3 items-center">
        {Icon && <Icon className="text-foreground-light w-4 h-4" />}
        <div className="flex flex-col">
          <p className="text-foreground text-sm p-0">{title}</p>
          <p className="text-foreground-lighter text-sm">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
