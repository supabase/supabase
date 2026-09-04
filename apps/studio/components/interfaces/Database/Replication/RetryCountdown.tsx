import dayjs from 'dayjs'
import { useEffect, useState } from 'react'

interface RetryCountdownProps {
  /** RFC 3339 timestamp of the next automatic retry */
  nextRetryTime: string
}

const formatRemaining = (milliseconds: number) => {
  const duration = dayjs.duration(milliseconds)
  if (duration.asHours() >= 1) return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`
  if (duration.asMinutes() >= 1) return `${duration.minutes()}m ${duration.seconds()}s`
  return `${duration.seconds()}s`
}

export const RetryCountdown = ({ nextRetryTime }: RetryCountdownProps) => {
  const target = new Date(nextRetryTime).getTime()
  const [remaining, setRemaining] = useState(() => target - Date.now())

  useEffect(() => {
    if (Number.isNaN(target)) return
    const tick = () => setRemaining(target - Date.now())
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [target])

  if (Number.isNaN(target)) return <>Retry time is invalid.</>

  return (
    <span role="status" aria-live="polite">
      {remaining <= 0 ? 'Retrying now…' : `Retrying in ${formatRemaining(remaining)}…`}
    </span>
  )
}
