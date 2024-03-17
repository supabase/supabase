// [Joshen] Just FYI eventually we're going to move to use toasts
// from the UI library, but this is a transition to move everything to
// react-hot-toast while we're trying to deprecate mobx entirely

import SparkBar from './SparkBar'

interface ToastLoaderProps {
  progress: number
  message: string
  description?: string
}

export const ToastLoader = ({ progress, message, description }: ToastLoaderProps) => {
  return (
    <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
      <SparkBar
        value={progress}
        max={100}
        type="horizontal"
        barClass="bg-brand"
        labelBottom={message}
        labelTop={`${progress.toFixed(2)}%`}
      />
      {description !== undefined && <p className="text-xs text-foreground-light">{description}</p>}
    </div>
  )
}
