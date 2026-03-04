'use client'

import { cn } from 'ui'

export interface StatusCodeProps {
  method?: string
  statusCode: number | string | undefined
  align?: 'center' | 'left' | 'right'
  className?: string
}

export function getStatusColor(
  value?: number | string,
  method?: string
): Record<'text' | 'bg' | 'border', string> {
  if (!method && value !== undefined) {
    const statusNum = Number(value)

    const isValidHttpStatus = !isNaN(statusNum) && statusNum >= 100 && statusNum < 600

    if (!isValidHttpStatus) {
      return {
        text: 'text-foreground-lighter',
        bg: 'bg-surface-200',
        border: '',
      }
    }
  }

  const normalized =
    typeof value === 'number'
      ? value < 100
        ? String(value)
        : String(Math.floor(value / 100))
      : typeof value === 'string' && /^\d+$/.test(value) && value.length >= 3
        ? String(Math.floor(Number(value) / 100))
        : value

  switch (normalized) {
    case '1':
    case '2':
    case '3':
    case 'info':
    case 'success':
    case undefined:
      return {
        text: 'text-foreground-lighter',
        bg: 'bg-surface-200',
        border: '',
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

export const StatusCode = ({
  method,
  statusCode,
  align = 'center',
  className,
}: StatusCodeProps) => {
  const colors = getStatusColor(statusCode, method)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'flex-shrink-0 flex text-xs font-mono w-[104px]',
          method && align === 'center' && 'w-[120px]',
          align === 'center' && 'items-center justify-center',
          align === 'right' && 'items-end justify-end',
          align === 'left' && 'items-start justify-start'
        )}
      >
        {method && (
          <span
            className={cn(
              'w-1/2 flex items-center justify-end',
              align === 'left' || (align === 'right' && 'w-auto')
            )}
          >
            <span className="select-text py-0.5 px-2 text-right rounded-l rounded-r-none bg-surface-75 text-foreground-light border border-r-0 w-auto">
              {method}
            </span>
          </span>
        )}
        <span
          className={cn(
            'w-1/2 flex items-center justify-start',
            align === 'left' || (align === 'right' && 'w-auto')
          )}
        >
          <span
            className={cn(
              'py-0.5 px-2 border rounded-l-0 rounded-r tabular-nums text-left w-auto',
              !method && 'rounded-l',
              colors.text,
              colors.bg,
              colors.border
            )}
          >
            {statusCode}
          </span>
        </span>
      </span>
    </div>
  )
}
