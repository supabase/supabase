import { getStatusColor } from 'components/interfaces/DataTableDemo/lib/request/status-code'
import { cn } from 'ui'
import { Minus } from 'lucide-react'
import { color } from 'framer-motion'

export function DataTableColumnStatusCode({
  value,
  level,
}: {
  value?: number | string
  level?: string
}) {
  console.log('level', level, level === 'warning' ? value : 'no warning')
  const colors = getStatusColor(level)
  if (!value) {
    return <Minus className="h-4 w-4 text-muted-foreground/50" />
  }

  return (
    <div className="flex items-center relative">
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
