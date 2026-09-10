import { cn } from 'ui'

import { LEVELS } from '../DataTable.constants'
import { getLevelColor } from '../DataTable.utils'

export const DataTableColumnLevelIndicator = ({
  value,
  className,
  dotClassName,
}: {
  value: (typeof LEVELS)[number]
  className?: string
  dotClassName?: string
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          getLevelColor(value).bg,
          getLevelColor(value).border,
          dotClassName
        )}
      />
    </div>
  )
}
