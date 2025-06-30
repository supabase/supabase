import { cn } from 'ui'
import { LEVELS } from '../DataTable.constants'
import { getLevelColor } from '../DataTable.utils'

export const DataTableColumnLevelIndicator = ({
  value,
  className,
}: {
  value: (typeof LEVELS)[number]
  className?: string
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('h-2.5 w-2.5 rounded-[2px]', getLevelColor(value).bg)} />
    </div>
  )
}
