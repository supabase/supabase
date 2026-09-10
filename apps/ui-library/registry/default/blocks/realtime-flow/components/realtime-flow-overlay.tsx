'use client'

import { cn } from '@/lib/utils'

type RealtimeFlowOverlayProps = {
  status: 'syncing' | 'error'
  message?: string
  className?: string
}

const RealtimeFlowOverlay = ({ status, message, className }: RealtimeFlowOverlayProps) => {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center bg-background/80 px-6 text-center backdrop-blur-[2px]',
        className
      )}
    >
      <span
        className={cn(
          'text-sm',
          status === 'error' ? 'font-medium text-destructive' : 'text-muted-foreground'
        )}
      >
        {status === 'error' ? message || 'Failed to sync flow' : 'Syncing…'}
      </span>
    </div>
  )
}

export { RealtimeFlowOverlay }
