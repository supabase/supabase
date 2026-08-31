import { Minus } from 'lucide-react'
import { cn } from 'ui'

export const DataTableColumnStatusCode = ({
  value,
  level,
  className,
}: {
  value?: number | string
  level?: string
  className?: string
}) => {
  const colorClassName = getStatusColor(level)

  function getStatusColor(value?: number | string): string {
    switch (value) {
      case '1':
      case 'info':
        return 'text-blue-500'
      case '2':
      case 'success':
        return 'text-foreground'
      case '4':
      case 'warning':
      case 'redirect':
        return 'text-warning'
      case '5':
      case 'error':
        return 'text-destructive'
      default:
        return 'text-foreground'
    }
  }

  if (!value) {
    return <Minus className="h-4 w-4 text-muted-foreground/50" />
  }

  return (
    <div className={cn('flex items-center relative', className)}>
      <div className={cn('flex items-center justify-center relative font-mono', colorClassName)}>
        {value}
      </div>
    </div>
  )
}
