import { getLevelLabel } from '../UnifiedLogs.utils'

export const TooltipLabel = ({
  level,
  isProcessLog = false,
}: {
  level: 'success' | 'warning' | 'error'
  isProcessLog?: boolean
}) => {
  return (
    <div className="mr-2 flex w-20 items-center justify-between gap-2 font-mono">
      <div className="capitalize text-foreground/70">
        {isProcessLog && level === 'success' ? 'info' : level}
      </div>
      {!isProcessLog && (
        <div className="text-xs text-muted-foreground/70">{getLevelLabel(level)}</div>
      )}
    </div>
  )
}
