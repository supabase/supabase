import { TimestampInfo } from 'ui-patterns'

interface HoverCardTimestampProps {
  date: Date
  className?: string
}

export function HoverCardTimestamp({ date, className }: HoverCardTimestampProps) {
  return (
    <div className="relative w-fit">
      <TimestampInfo utcTimestamp={date.getTime()} />
    </div>
  )
}
