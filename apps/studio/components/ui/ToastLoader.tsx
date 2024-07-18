// [Joshen] Just FYI eventually we're going to move to use toasts
// from the UI library, but this is a transition to move everything to
// react-hot-toast while we're trying to deprecate mobx entirely

import { PropsWithChildren } from 'react'

import SparkBar from './SparkBar'

interface ToastLoaderProps {
  progress: number
  message: string
  labelTopOverride?: string
}

export const ToastLoader = ({
  progress,
  message,
  labelTopOverride,
  children,
}: PropsWithChildren<ToastLoaderProps>) => {
  return (
    <div className="flex flex-col gap-2" style={{ minWidth: '220px' }}>
      <SparkBar
        value={progress}
        max={100}
        type="horizontal"
        barClass="bg-brand"
        labelBottom={message}
        labelBottomClass="normal-nums"
        labelTop={labelTopOverride || `${progress.toFixed(2)}%`}
        labelTopClass="tabular-nums"
      />
      {children}
    </div>
  )
}
