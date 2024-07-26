import { Progress } from '@radix-ui/react-progress'
import { Loader2 } from 'lucide-react'

/**
 * A component to display a progress bar with a message and an optional action button. Meant to be rendered in toasts
 * like so
 *  toast.loading(
 *    <ToastProgress
 *      progress={0}
 *      message={`Downloading files...`}
 *    />,
 *    { id: toastId, closeButton: false }
 *  )
 */
export const ToastProgress = ({
  progress,
  progressPrefix,
  action,
  message,
}: {
  progress: number
  progressPrefix?: string
  action?: React.ReactNode
  message: string
}) => (
  <div className="flex gap-3 w-full">
    <Loader2 className="animate-spin text-foreground-muted mt-0.5" size={16} />
    <div className="flex flex-col gap-2 w-full">
      <div className="flex w-full justify-between">
        <p className="text-foreground text-sm">{message}</p>
        <p className="text-foreground-light text-sm font-mono">
          {progressPrefix || ''}
          {`${Number(progress).toFixed(0)}%`}
        </p>
      </div>
      <Progress value={progress} className="w-full" />
      <div className="flex flex-row gap-2">
        <small className="text-foreground-muted text-xs">
          Please do not close the browser until completed
        </small>
        {action}
      </div>
    </div>
  </div>
)
