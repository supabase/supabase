import { cn } from 'ui/src/lib/utils'

import CountdownStep from './CountdownStep'

interface CountdownWidgetProps {
  days?: string
  hours?: string
  minutes?: string
  seconds?: string
  showCard?: boolean
  className?: string
  dividerClassName?: string
  size?: 'small' | 'large'
}

export function CountdownWidget({
  days,
  hours,
  minutes,
  seconds,
  showCard = true,
  className,
  dividerClassName,
  size,
}: CountdownWidgetProps) {
  const isLarge = size === 'large'
  const Colon = () => (
    <span
      className={cn(
        'text-xs mx-px text-foreground-lighter',
        isLarge && 'text-lg',
        dividerClassName
      )}
    >
      :
    </span>
  )

  return (
    <div className={cn('flex gap-1 items-center text-foreground-lighter', className)}>
      {days !== undefined && days != '0' ? (
        <>
          <CountdownStep value={days} unit="d" showCard={showCard} size={size} />
          <Colon />
        </>
      ) : null}
      {hours !== undefined && hours != '0' ? (
        <>
          <CountdownStep value={hours} unit="h" showCard={showCard} size={size} />
          <Colon />
        </>
      ) : null}
      {minutes !== undefined && minutes != '0' ? (
        <>
          <CountdownStep value={minutes} unit="m" showCard={showCard} size={size} />
          {seconds !== undefined && <Colon />}
        </>
      ) : null}
      {seconds !== undefined ? (
        <CountdownStep value={seconds} unit="s" showCard={showCard} size={size} />
      ) : null}
    </div>
  )
}
