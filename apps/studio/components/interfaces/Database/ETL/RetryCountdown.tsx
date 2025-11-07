import { useCallback, useEffect, useMemo, useState } from 'react'

interface RetryCountdownProps {
  nextRetryTime: string // RFC3339 formatted date
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  isInvalid: boolean
}

export const RetryCountdown = ({ nextRetryTime }: RetryCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    isInvalid: false,
  })

  const targetTimestamp = useMemo(() => {
    try {
      const date = new Date(nextRetryTime)
      if (isNaN(date.getTime())) {
        return null
      }
      return date.getTime()
    } catch {
      return null
    }
  }, [nextRetryTime])

  const calculateTimeRemaining = useCallback((targetTime: number): TimeRemaining => {
    const now = Date.now()
    const difference = targetTime - now

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isInvalid: false }
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24))
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((difference % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds, isExpired: false, isInvalid: false }
  }, [])

  useEffect(() => {
    if (targetTimestamp === null) return

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(targetTimestamp))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [targetTimestamp, calculateTimeRemaining])

  const { timeDisplay, statusMessage } = useMemo(() => {
    if (targetTimestamp === null) {
      return {
        timeDisplay: 'Invalid retry time format',
        statusMessage: '',
      }
    }

    const formatTimeUnit = (value: number, unit: string) => {
      if (value === 0) return null
      return `${value}${unit.charAt(0)}`
    }

    let timeDisplay: string
    let statusMessage: string

    if (timeRemaining.isExpired) {
      statusMessage = ''
      timeDisplay = 'Retrying soon...'
    } else {
      const parts = [
        formatTimeUnit(timeRemaining.days, 'day'),
        formatTimeUnit(timeRemaining.hours, 'hour'),
        formatTimeUnit(timeRemaining.minutes, 'minute'),
        formatTimeUnit(timeRemaining.seconds, 'second'),
      ].filter(Boolean)
      statusMessage = parts.length === 0 ? '' : 'Next retry in:'
      timeDisplay = parts.length === 0 ? 'Retrying soon...' : parts.join(' ')
    }

    return { timeDisplay, statusMessage }
  }, [targetTimestamp, timeRemaining])

  return (
    <div role="status" aria-live="polite" aria-label={`${statusMessage} ${timeDisplay}`}>
      <span className="text-xs font-medium">{statusMessage}</span>{' '}
      {/* [Joshen] It's a bit hard to debug without doing this locally, but we could use CountdownTimerSpan here perhaps */}
      <span className="text-xs font-mono">{timeDisplay}</span>
    </div>
  )
}
