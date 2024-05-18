import { cn } from 'ui/src/lib/utils'
import CountdownStep from './CountdownStep'

interface CountdownWidgetProps {
  days?: string
  hours?: string
  minutes?: string
  seconds?: string
  showCard?: boolean
  className?: string
  size?: 'small' | 'large'
}

export function CountdownWidget({
  days,
  hours,
  minutes,
  seconds,
  showCard = true,
  className,
  size,
}: CountdownWidgetProps) {
  const isLarge = size === 'large'
  const Colon = () => <span className={cn('text-xs mx-px', isLarge && 'text-lg')}>:</span>

  const showItem = (item: string | undefined) => item !== undefined && item !== '0'

  return (
    <div className={cn('flex gap-1 items-center', className)}>
      {days !== undefined && days !== '0' ? (
        <>
          <CountdownStep value={days} unit="d" showCard={showCard} size={size} />
          <Colon />
        </>
      ) : null}
      {hours !== undefined ? (
        <>
          <CountdownStep value={hours} unit="h" showCard={showCard} size={size} />
          <Colon />
        </>
      ) : null}
      {minutes !== undefined ? (
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
