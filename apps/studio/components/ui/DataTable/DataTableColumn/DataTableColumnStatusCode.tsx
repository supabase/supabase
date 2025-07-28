import { Minus } from 'lucide-react'

import { cn } from 'ui'
import { getStatusColor } from '../DataTable.utils'

export const DataTableColumnStatusCode = ({
  value,
  level,
  className,
}: {
  value?: number | string
  level?: string
  className?: string
}) => {
  const colors = getStatusColor(level)
  if (!value) {
    return <Minus className="h-4 w-4 text-muted-foreground/50" />
  }

  return (
    <div className={cn('flex items-center relative', className)}>
      <div
        className={cn(
          'px-1 py-[0.03rem] rounded-md',
          'flex items-center justify-center relative font-mono',
          colors.text,
          colors.bg,
          colors.border
        )}
      >
        {value}
      </div>
    </div>
  )
}
