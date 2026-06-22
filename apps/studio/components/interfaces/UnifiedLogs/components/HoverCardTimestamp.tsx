import { cn } from 'ui'
import { TimestampInfo } from 'ui-patterns'

interface HoverCardTimestampProps {
  date: Date
  className?: string
}

export function HoverCardTimestamp({ date, className }: HoverCardTimestampProps) {
  return (
    <div className={cn('relative w-fit', className)}>
      <TimestampInfo utcTimestamp={date.getTime()} />
    </div>
  )
}
