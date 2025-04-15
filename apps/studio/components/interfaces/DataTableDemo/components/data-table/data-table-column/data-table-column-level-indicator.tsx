import { _LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { getLevelColor } from 'components/interfaces/DataTableDemo/lib/request/level'
import { cn } from 'ui'

export function DataTableColumnLevelIndicator({
  value,
  className,
}: {
  value: (typeof _LEVELS)[number]
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('h-2.5 w-2.5 rounded-[2px]', getLevelColor(value).bg)} />
    </div>
  )
}
