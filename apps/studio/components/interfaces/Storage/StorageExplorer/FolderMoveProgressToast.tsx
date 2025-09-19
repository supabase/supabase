import { Loader2 } from 'lucide-react'
import { Progress } from 'ui'

export const FolderMoveProgressToast = ({
  current,
  total,
  folderName,
}: {
  current: number
  total: number
  folderName: string
}) => {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0
  const isCalculating = total === 0

  return (
    <div className="flex gap-3 w-full">
      <div className="flex flex-col gap-2 w-full">
        <div className="flex w-full justify-between">
          <p className="text-foreground text-sm">Moving folder "{folderName}"</p>
          {isCalculating ? (
            <Loader2 className="animate-spin text-foreground-muted" size={16} />
          ) : (
            <p className="text-foreground-light text-sm font-mono">{`${progress}%`}</p>
          )}
        </div>
        {!isCalculating && <Progress value={progress} className="w-full" />}
        <small className="text-foreground-light text-xs flex items-center gap-0.5">
          {isCalculating ? 'Calculating items to move...' : `Moved ${current} / ${total} items...`}
        </small>
      </div>
    </div>
  )
}
