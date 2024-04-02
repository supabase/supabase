import { useEffect, useState } from 'react'
import { cn } from 'ui'

interface CountdownStepProps {
  value: string | number
  unit: string
  showCard?: boolean
  size?: 'small' | 'large'
}

function CountdownStep({ value, unit, showCard = true, size = 'small' }: CountdownStepProps) {
  const isLarge = size === 'large'
  const [isMounted, setIsMounted] = useState(false)
  const valueWithZero = (value as number) > 9 ? value : '0' + value

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div
      className={cn(
        'font-mono uppercase tracking-[0.05rem] text-sm',
        showCard
          ? 'rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-border-muted to-border-muted/20'
          : 'tracking-[0.1rem]',
        isLarge && 'text-lg'
      )}
    >
      <div
        className={cn(
          showCard
            ? 'py-1 px-2 rounded-md w-11 leading-4 flex items-center justify-center bg-black backdrop-blur-md'
            : cn('flex items-center justify-center w-7 py-1 px-1', isLarge && 'w-9')
        )}
      >
        <span className="m-0">{valueWithZero}</span>
        <span>{unit}</span>
      </div>
    </div>
  )
}

export default CountdownStep
