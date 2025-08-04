import { useEffect, useState } from 'react'
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
}

export const RetryCountdown = ({ nextRetryTime }: RetryCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  const calculateTimeRemaining = (targetTime: string): TimeRemaining => {
    try {
      const now = new Date().getTime()
      const target = new Date(targetTime).getTime()
      const difference = target - now

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds, isExpired: false }
    } catch (error) {
      console.error('Invalid date format:', nextRetryTime, error)
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }
  }

  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining(nextRetryTime))
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [nextRetryTime])

  const formatTimeUnit = (value: number, unit: string) => {
    if (value === 0) return null
    return `${value}${unit.charAt(0)}`
  }

  const getTimeDisplay = () => {
    if (timeRemaining.isExpired) {
      return 'Retry time reached'
    }

    const parts = [
      formatTimeUnit(timeRemaining.days, 'day'),
      formatTimeUnit(timeRemaining.hours, 'hour'),
      formatTimeUnit(timeRemaining.minutes, 'minute'),
      formatTimeUnit(timeRemaining.seconds, 'second'),
    ].filter(Boolean)

    if (parts.length === 0) {
      return 'Retrying soon...'
    }

    return parts.join(' ')
  }

  const getDisplayColor = () => {
    if (timeRemaining.isExpired) {
      return 'text-brand-600'
    }
    
    const totalMinutes = timeRemaining.days * 24 * 60 + timeRemaining.hours * 60 + timeRemaining.minutes
    
    if (totalMinutes <= 5) {
      return 'text-warning-600'
    } else if (totalMinutes <= 60) {
      return 'text-brand-600'
    } else {
      return 'text-foreground-light'
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className={`w-3 h-3 ${getDisplayColor()}`} />
      <div className="text-xs">
        <span className="font-medium">
          {timeRemaining.isExpired ? 'Automatic retry' : 'Next retry in:'}
        </span>{' '}
        <span className={`font-mono ${getDisplayColor()}`}>
          {getTimeDisplay()}
        </span>
      </div>
    </div>
  )
}