import { ChevronDownIcon, ClockIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { formatHourlyRate, formatRoundedCurrency } from './PlanChangeSummary.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

/**
 * An illustrative day of traffic: idle overnight, busy in the afternoon. Each entry is
 * one hour's activity level, drawn inside a uniform billed track so the shape says what
 * the label says — the server is billed the same whether that hour is busy or idle.
 */
const HOURLY_ACTIVITY = [0, 0, 0, 0, 0, 1, 2, 3, 3, 4, 2, 4, 4, 3, 0, 3, 4, 2, 1, 0, 0, 1, 0, 0]

/** Illustrative hourly compute rate used by the chart and its copy. */
const ILLUSTRATIVE_HOURLY_RATE = 0.0137

/** How long one hour of the illustrative day takes to play while the section is open. */
const HOUR_TICK_MS = 400

/** Ticks the finished day holds on screen before the loop starts over. */
const HOLD_TICKS = 8

const ACTIVITY_HEIGHT: Record<number, string> = {
  1: 'h-1.5',
  2: 'h-3',
  3: 'h-5',
  4: 'h-7',
}

/**
 * Compute bills by the hour at the same rate whether a project is busy or idle, which
 * is the part customers are most often surprised by. An illustrative day says it
 * visually: the idle hours are drawn as empty outlines that still occupy an hour slot.
 */
export const HourlyBillingPanel = ({
  perProjectMonthlyPrice,
  hourlyRate = ILLUSTRATIVE_HOURLY_RATE,
  onOpen,
}: {
  perProjectMonthlyPrice: number | null
  /** Hourly compute rate the copy and chart use. Defaults to an illustrative rate. */
  hourlyRate?: number
  onOpen?: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tick, setTick] = useState(0)

  // While the section is open the chart loops through the day, hour by hour.
  useEffect(() => {
    if (!isOpen) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTick(HOURLY_ACTIVITY.length)
      return
    }

    setTick(0)
    const interval = setInterval(
      () => setTick((current) => (current + 1) % (HOURLY_ACTIVITY.length + HOLD_TICKS)),
      HOUR_TICK_MS
    )
    return () => clearInterval(interval)
  }, [isOpen])

  // The extra hold ticks at the end of a loop keep the finished day on screen for a beat.
  const elapsedHours = Math.min(tick, HOURLY_ACTIVITY.length)
  const readoutHour = Math.max(elapsedHours - 1, 0)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) onOpen?.()
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="overflow-hidden rounded-md border bg-field"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground-light">
        <ClockIcon size={14} className="shrink-0" aria-hidden="true" />
        <span>Billed every hour, even when idle</span>
        <ChevronDownIcon
          size={14}
          className={cn('ml-auto shrink-0 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-open:animate-collapsible-down data-closed:animate-collapsible-up motion-reduce:animate-none">
        <div className="px-3 pb-3">
          <p className="text-sm text-foreground-light">
            Each project is a dedicated server. It bills{' '}
            <span translate="no">{formatHourlyRate(hourlyRate)}</span> for every hour it is
            provisioned, busy or idle
            {perProjectMonthlyPrice !== null && (
              <span>
                , which adds up to about{' '}
                <span translate="no">{formatRoundedCurrency(perProjectMonthlyPrice)}/mo</span>
              </span>
            )}
            <span>.</span>{' '}
            <InlineLink href={`${DOCS_URL}/guides/platform/manage-your-usage/compute`}>
              Learn about compute
            </InlineLink>
          </p>

          <div className="mt-3 flex h-10 items-end gap-1" aria-hidden="true">
            {HOURLY_ACTIVITY.map((activity, hour) => {
              const isCurrentHour = hour === readoutHour

              return activity === 0 ? (
                <span
                  key={hour}
                  className={cn(
                    'h-full flex-1 rounded-xs border transition-colors duration-150',
                    isCurrentHour
                      ? 'border-solid border-foreground-light bg-foreground-muted/30'
                      : 'border-dashed border-foreground-muted'
                  )}
                />
              ) : (
                <span
                  key={hour}
                  className={cn(
                    'flex-1 rounded-xs transition-colors duration-150',
                    ACTIVITY_HEIGHT[activity],
                    isCurrentHour ? 'bg-foreground' : 'bg-foreground-muted/60'
                  )}
                />
              )
            })}
          </div>

          <p
            className="mt-1.5 text-right text-xs text-foreground-lighter tabular-nums"
            translate="no"
          >
            {`${String(readoutHour).padStart(2, '0')}:00 · ${formatHourlyRate(hourlyRate * elapsedHours)} billed`}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
