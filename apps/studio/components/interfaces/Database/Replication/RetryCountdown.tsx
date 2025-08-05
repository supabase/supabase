import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock } from 'lucide-react'

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

  const { timeDisplay, displayColor, statusMessage } = useMemo(() => {
    if (targetTimestamp === null) {
      return {
        timeDisplay: 'Invalid retry time format',
        displayColor: 'text-warning-600',
        statusMessage: '',
      }
    }

    const formatTimeUnit = (value: number, unit: string) => {
      if (value === 0) return null
      return `${value}${unit.charAt(0)}`
    }

    let timeDisplay: string
    let displayColor: string
    let statusMessage: string

    if (timeRemaining.isExpired) {
      timeDisplay = 'Retry time reached'
      displayColor = 'text-brand-600'
      statusMessage = 'Automatic retry'
    } else {
      const parts = [
        formatTimeUnit(timeRemaining.days, 'day'),
        formatTimeUnit(timeRemaining.hours, 'hour'),
        formatTimeUnit(timeRemaining.minutes, 'minute'),
        formatTimeUnit(timeRemaining.seconds, 'second'),
      ].filter(Boolean)

      timeDisplay = parts.length === 0 ? 'Retrying soon...' : parts.join(' ')
      statusMessage = 'Next retry in:'

      const totalMinutes =
        timeRemaining.days * 24 * 60 + timeRemaining.hours * 60 + timeRemaining.minutes
      if (totalMinutes <= 5) {
        displayColor = 'text-warning-600'
      } else if (totalMinutes <= 60) {
        displayColor = 'text-brand-600'
      } else {
        displayColor = 'text-foreground-light'
      }
    }

    return { timeDisplay, displayColor, statusMessage }
  }, [targetTimestamp, timeRemaining])

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={`${statusMessage} ${timeDisplay}`}
    >
      <Clock className={`w-3 h-3 ${displayColor}`} />
      <div className="text-xs">
        <span className="font-medium">{statusMessage}</span>{' '}
        <span className={`font-mono ${displayColor}`}>{timeDisplay}</span>
      </div>
    </div>
  )
}
