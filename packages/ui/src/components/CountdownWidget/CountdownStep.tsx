import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils/cn'

interface CountdownStepProps {
  value: string | number
  unit: string
  showCard?: boolean
}

function CountdownStep({ value, unit, showCard = true }: CountdownStepProps) {
  const [isMounted, setIsMounted] = useState(false)
  const valueWithZero = (value as number) > 9 ? value : '0' + value

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <div
      className={cn(
        'font-mono uppercase text-foreground-lighter tracking-[0.05rem] text-sm',
        showCard
          ? 'rounded-md p-[1px] overflow-hidden bg-gradient-to-b from-border-muted to-border-muted/20'
          : 'tracking-[0.1rem]'
      )}
    >
      <div
        className={cn(
          showCard
            ? 'py-1 px-2 rounded-md w-11 leading-4 flex items-center justify-center bg-black backdrop-blur-md'
            : 'flex items-center justify-center w-7 py-1 px-1'
        )}
      >
        <span className="m-0">{valueWithZero}</span>
        <span>{unit}</span>
      </div>
    </div>
  )
}

export default CountdownStep
