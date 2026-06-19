'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useRef, useState } from 'react'
import { cn, copyToClipboard, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { useTimestampInfoContext } from './TimestampInfoProvider'

export { TimestampInfoProvider } from './TimestampInfoProvider'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

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
  /**
   * IANA timezone to render the timestamp in. When omitted, falls back to the
   * browser's local timezone (preserving the historical default).
   */
  timezone?: string
}

export const timestampLocalFormatter = ({ utcTimestamp, format, timezone }: TimestampFormatter) => {
  const timestamp = isUnixMicro(utcTimestamp) ? unixMicroToIsoTimestamp(utcTimestamp) : utcTimestamp
  const base = dayjs.utc(timestamp)
  const localised = timezone ? base.tz(timezone) : base.local()
  return localised.format(format)
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
  format = 'DD MMM YY HH:mm:ss',
  labelFormat = 'DD MMM YY HH:mm:ss',
  label,
  timezone: timezoneProp,
}: {
  className?: string
  utcTimestamp: string | number
  displayAs?: 'local' | 'utc'
  format?: string
  labelFormat?: string
  label?: string
  /**
   * IANA timezone to render the timestamp in. When omitted the component
   * falls back to the value supplied by `TimestampInfoProvider`, then to the
   * browser's local timezone.
   */
  timezone?: string
}) => {
  const { timezone: timezoneFromContext } = useTimestampInfoContext()
  const effectiveTimezone = timezoneProp ?? timezoneFromContext
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const local = timestampLocalFormatter({ utcTimestamp, format, timezone: effectiveTimezone })
  const browserLocal = timestampLocalFormatter({ utcTimestamp, format })
  const utc = timestampUtcFormatter({ utcTimestamp, format })
  const relative = timestampRelativeFormatter({ utcTimestamp })
  const [align, setAlign] = useState<'start' | 'end'>('start')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const localTimezone = effectiveTimezone ?? browserTimezone
  // Show the browser timezone as a separate row whenever the user has
  // overridden it via the picker, so they don't lose context for "what time
  // is it where I am" while reading logs in another timezone.
  const showBrowserRow = !!effectiveTimezone && effectiveTimezone !== browserTimezone

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
      <div
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          copyToClipboard(value, () => {
            setCopied(true)
            setTimeout(() => {
              setCopied(false)
            }, 1000)
          })
        }}
        className={cn(
          'relative cursor-pointer flex gap-y-2 gap-x-0.5 hover:bg-surface-100 px-2 py-1 group',
          { 'bg-surface-100': copied }
        )}
      >
        <div className="flex items-center gap-x-2 text-left truncate">
          <p>{label}</p>
          <div className="border-t w-full border-dashed" />
        </div>
        <div className="relative flex items-center gap-x-2 grow">
          <div className="border-t w-full border-dashed z-10" />
          {copied && (
            <span className="flex items-center justify-end w-full absolute inset-0 flex items-right text-brand-600 bg-surface-100">
              Copied!
            </span>
          )}
          <span className="flex items-center gap-x-2 justify-end whitespace-nowrap">{value}</span>
        </div>
      </div>
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
          {label
            ? label
            : displayAs === 'local'
              ? timestampLocalFormatter({
                  utcTimestamp,
                  format: labelFormat,
                  timezone: effectiveTimezone,
                })
              : timestampUtcFormatter({ utcTimestamp, format: labelFormat })}
        </span>
      </TooltipTrigger>
      <TooltipContent align={align} side="right" className="font-mono p-0 py-1 min-w-80">
        <TooltipRow label="UTC" value={utc} />
        <TooltipRow label={localTimezone} value={local} />
        {showBrowserRow && <TooltipRow label={browserTimezone} value={browserLocal} />}
        <TooltipRow label="Relative" value={relative} />
        <TooltipRow label="Timestamp" value={String(utcTimestamp)} />
      </TooltipContent>
    </Tooltip>
  )
}
