import { format } from 'date-fns'

import { cn } from 'ui'
import { TimestampInfo } from 'ui-patterns'

interface HoverCardTimestampProps {
  date: Date
  className?: string
}

export function HoverCardTimestamp({ date, className }: HoverCardTimestampProps) {
  return (
    <div className="relative w-fit">
      <TimestampInfo utcTimestamp={date.getTime()}>
        <div className={cn('font-mono flex gap-1.5', className)}>
          <span className="text-foreground/50 uppercase">{format(date, 'MMM')}</span>
          <span className="text-foreground/50 uppercase"> {format(date, 'dd')} </span>
          <span>
            {format(date, 'HH:mm:ss')}
            <span className="text-foreground/50">.{format(date, 'SS')}</span>
          </span>
        </div>
      </TimestampInfo>
    </div>
  )
}
