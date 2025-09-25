import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

export const formatDuration = (milliseconds: number) => {
  const duration = dayjs.duration(milliseconds, 'milliseconds')

  const days = Math.floor(duration.asDays())
  const hours = duration.hours()
  const minutes = duration.minutes()
  const seconds = duration.seconds()
  const totalSeconds = duration.asSeconds()

  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(2)}s`
  }

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)

  return parts.length > 0 ? parts.join(' ') : '0s'
}
