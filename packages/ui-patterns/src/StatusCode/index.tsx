'use client'

import { cn } from 'ui'

export interface StatusCodeProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'default'
  method?: string
  statusCode: number | string | undefined
}

export function getStatusColor(value?: number | string): Record<'text' | 'bg' | 'border', string> {
  switch (value) {
    case '1':
    case 'info':
      return {
        text: 'text-blue-500',
        bg: '',
        border: 'border-blue-200 dark:border-blue-800',
      }
    case '2':
    case 'success':
      return {
        text: 'text-foreground-lighter',
        bg: 'bg-brand-300 text-brand-600',
        border: 'border-brand-400/50 dark:border-green-800',
      }
    case '4':
    case 'warning':
    case 'redirect':
      return {
        text: 'text-warning',
        bg: 'bg-warning-300 dark:bg-warning-200',
        border: 'border-warning-400/50 dark:border-warning-400/50',
      }
    case '5':
    case 'error':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive-300 dark:bg-destructive-300/50',
        border: 'border-destructive-400/50 dark:border-destructive-400/50',
      }
    default:
      return {
        text: 'text-foreground-lighter',
        bg: '',
        border: '',
      }
  }
}

export const StatusCode = ({ type, method, statusCode }: StatusCodeProps) => {
  const colors = getStatusColor(type)
  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0 flex items-center text-xs font-mono">
        <span className="select-text py-0.5 px-2 text-center rounded-l rounded-r-none bg-surface-75 text-foreground-light border border-r-0">
          {method}
        </span>
        <span
          className={cn(
            'py-0.5 px-2 border rounded-l-0 rounded-r tabular-nums',
            colors.text,
            colors.bg,
            colors.border
          )}
        >
          {statusCode}
        </span>
      </span>
    </div>
  )
}
