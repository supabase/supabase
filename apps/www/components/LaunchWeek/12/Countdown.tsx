import React from 'react'
import Countdown from 'react-countdown'
import { CountdownWidget } from 'ui-patterns/CountdownWidget'

const CountdownComponent = ({
  date,
  showCard = true,
  className,
  size = 'small',
}: {
  date: string | number | Date
  showCard?: boolean
  className?: string
  size?: 'small' | 'large'
}) => {
  if (!date) return null

  const renderer = ({ days, hours, minutes, seconds, completed }: any) => {
    if (completed) {
      // Render a completed state
      return null
    } else {
      // Render countdown
      return (
        <div className="flex items-baseline gap-3 font-mono text-sm text-foreground-muted">
          <span>Launch Week starts in</span>
          <CountdownWidget
            days={days}
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            showCard={showCard}
            className={className}
            size={size}
          />
        </div>
      )
    }
  }

  return <Countdown date={new Date(date)} renderer={renderer} />
}

export default CountdownComponent
