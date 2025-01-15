'use client'
import { useEffect, useRef, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/src/components/shadcn/ui/tooltip'
import { cn } from 'ui/src/lib/utils'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import { Clipboard } from 'lucide-react'

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
  utcTimestamp: string | number
  format?: string
}

export const timestampLocalFormatter = ({ utcTimestamp, format }: TimestampFormatter) => {
  const timestamp = isUnixMicro(utcTimestamp) ? unixMicroToIsoTimestamp(utcTimestamp) : utcTimestamp
  return dayjs.utc(timestamp).local().format(format)
}

const timestampUtcFormatter = ({ utcTimestamp, format }: TimestampFormatter) => {
  const timestamp = isUnixMicro(utcTimestamp) ? unixMicroToIsoTimestamp(utcTimestamp) : utcTimestamp
  return dayjs.utc(timestamp).format(format)
}

const timestampRelativeFormatter = ({ utcTimestamp }: TimestampFormatter) => {
  const timestamp = isUnixMicro(utcTimestamp) ? unixMicroToIsoTimestamp(utcTimestamp) : utcTimestamp
  return dayjs.utc(timestamp).fromNow()
}

/**
 * TimestampInfo component displays a timestamp with a tooltip showing various time formats.
 * @param {string|number} props.utcTimestamp - UTC timestamp value. Can be either:
 *   - ISO 8601 string (e.g., "2024-01-01T00:00:00Z")
 *   - Unix microseconds (16-digit number)
 * @param {string} [props.format="DD MMM  HH:mm:ss"] - Display format for the timestamp (using dayjs format)
 * @returns {JSX.Element} Timestamp display with tooltip showing UTC, local, relative, and raw timestamp values
 */
export const TimestampInfo = ({
  utcTimestamp,
  className,
  displayAs = 'local',
  format = 'DD MMM  HH:mm:ss',
  labelFormat = 'DD MMM HH:mm:ss',
}: {
  className?: string
  utcTimestamp: string | number
  displayAs?: 'local' | 'utc'
  format?: string
  labelFormat?: string
}) => {
  const local = timestampLocalFormatter({ utcTimestamp, format })
  const utc = timestampUtcFormatter({ utcTimestamp, format })
  const relative = timestampRelativeFormatter({ utcTimestamp })
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
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
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
          'relative cursor-default grid grid-cols-2 gap-2 hover:bg-surface-100 px-2 py-1 group',
          { 'bg-surface-100': copied }
        )}
      >
        <span className="text-right truncate">{label}:</span>
        <div className="relative">
          {copied && (
            <span className="absolute inset-0 flex items-center text-brand-600 bg-surface-100">
              Copied!
            </span>
          )}
          <span className="flex items-center gap-x-2">
            {value}
            <Clipboard size={12} className="opacity-0 group-hover:opacity-100 transition" />
          </span>
        </div>
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        asChild
        ref={triggerRef}
        className={`text-xs ${className} border-b border-transparent hover:border-dashed hover:border-foreground-light`}
      >
        <span>
          {displayAs === 'local'
            ? timestampLocalFormatter({ utcTimestamp, format: labelFormat })
            : timestampUtcFormatter({ utcTimestamp, format: labelFormat })}
        </span>
      </TooltipTrigger>
      <TooltipContent align={align} side="right" className="font-mono p-0 py-1">
        <TooltipRow label="UTC" value={utc} />
        <TooltipRow label={`${localTimezone}`} value={local} />
        <TooltipRow label="Relative" value={relative} />
        <TooltipRow label="Timestamp" value={String(utcTimestamp)} />
      </TooltipContent>
    </Tooltip>
  )
}
