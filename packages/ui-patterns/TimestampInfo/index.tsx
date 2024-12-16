'use client'
import { useEffect, useRef, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/src/components/shadcn/ui/tooltip'
import { cn } from 'ui/src/lib/utils'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'

dayjs.extend(relativeTime)
dayjs.extend(utc)

const unixMicroToIsoTimestamp = (unix: string | number): string => {
  return dayjs.unix(Number(unix) / 1000 / 1000).toISOString()
}

const isUnixMicro = (unix: string | number): boolean => {
  const digitLength = String(unix).length === 16
  const isNum = !Number.isNaN(Number(unix))
  return isNum && digitLength
}

type TimestampFormatter = {
  value: string | number
  isUTC: boolean
  format?: string
}

const timestampLocalFormatter = ({ value, format, isUTC }: TimestampFormatter) => {
  const timestamp = isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : value
  if (isUTC) {
    return dayjs.utc(timestamp).local().format(format)
  }
  return dayjs(timestamp).format(format)
}

const timestampUtcFormatter = ({ value, isUTC, format }: TimestampFormatter) => {
  const timestamp = isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : value
  return isUTC ? dayjs.utc(timestamp).format(format) : dayjs(timestamp).utc().format(format)
}

const timestampRelativeFormatter = ({ value, isUTC }: TimestampFormatter) => {
  const timestamp = isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : value
  return isUTC ? dayjs.utc(timestamp).fromNow() : dayjs(timestamp).fromNow()
}

export const TimestampInfo = ({
  value,
  className,
  isUTC = false,
  format = 'DD MMM  HH:mm:ss',
}: {
  className?: string
  value: string | number
  isUTC?: boolean
  format?: string
}) => {
  const local = timestampLocalFormatter({ value, isUTC, format })
  const utc = timestampUtcFormatter({ value, isUTC, format })
  const relative = timestampRelativeFormatter({ value, isUTC })
  const [align, setAlign] = useState<'start' | 'end'>('start')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Calculate alignment based on trigger position
  // Needed so that the tooltip isn't hidden behind the header on top rows (in logs)
  useEffect(() => {
    const updateAlignment = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const windowHeight = window.innerHeight
        setAlign(rect.top < windowHeight / 2 ? 'start' : 'end')
      }
    }

    updateAlignment()
    window.addEventListener('scroll', updateAlignment)
    window.addEventListener('resize', updateAlignment)

    return () => {
      window.removeEventListener('scroll', updateAlignment)
      window.removeEventListener('resize', updateAlignment)
    }
  }, [])

  const TooltipRow = ({ label, value }: { label: string; value: string }) => {
    const [copied, setCopied] = useState(false)

    return (
      <span
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          navigator.clipboard.writeText(value)
          setCopied(true)

          setTimeout(() => {
            setCopied(false)
          }, 1000)
        }}
        className={cn(
          'relative cursor-default grid grid-cols-2 gap-2 hover:bg-surface-100 px-2 py-1',
          {
            'bg-surface-100': copied,
          }
        )}
      >
        <span className="text-right truncate">{label}:</span>
        <div className="relative">
          {copied && (
            <span className="absolute inset-0 flex items-center text-brand-600 bg-surface-100">
              Copied!
            </span>
          )}
          <span>{value}</span>
        </div>
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        ref={triggerRef}
        className={`text-xs ${className} border-b border-transparent hover:border-dashed hover:border-foreground-light`}
      >
        <span>{timestampLocalFormatter({ value, isUTC, format })}</span>
      </TooltipTrigger>
      <TooltipContent align={align} side="right" className="font-mono p-0 py-1">
        <TooltipRow label="UTC" value={utc} />
        <TooltipRow label={`${localTimezone}`} value={local} />
        <TooltipRow label="Relative" value={relative} />
        <TooltipRow label="Timestamp" value={String(value)} />
      </TooltipContent>
    </Tooltip>
  )
}
