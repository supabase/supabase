'use client'

import { cn } from 'ui'

export interface StatusCodeProps {
  method: string
  statusCode: number | string | undefined
}

export const getStatusLevel = (status?: number | string): string => {
  if (!status) return 'success'
  const statusNum = Number(status)
  if (statusNum >= 500) return 'error'
  if (statusNum >= 400) return 'warning'
  if (statusNum >= 300) return 'info' // 3xx redirects are informational
  if (statusNum >= 200) return 'success'
  if (statusNum >= 100) return 'info'
  return 'success'
}

export function getStatusColor(value?: number | string): Record<'text' | 'bg' | 'border', string> {
  switch (value) {
    case '1':
    case 'info':
      return {
        text: 'text-blue-900',
        bg: 'bg-blue-300',
        border: 'border-blue-500',
      }
    case '2':
    case 'success':
      return {
        text: 'text-brand-600',
        bg: 'bg-brand-300',
        border: 'border-brand-500/50',
      }
    case '4':
    case 'warning':
    case 'redirect':
      return {
        text: 'text-warning',
        bg: 'bg-warning-300',
        border: 'border-warning-500/50',
      }
    case '5':
    case 'error':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive-300',
        border: 'border-destructive-500/50',
      }
    default:
      return {
        text: 'text-foreground-lighter',
        bg: 'bg-surface-200',
        border: '',
      }
  }
}

export const StatusCode = ({ method, statusCode }: StatusCodeProps) => {
  const level = getStatusLevel(statusCode)
  const colors = getStatusColor(level)

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
