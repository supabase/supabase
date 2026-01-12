import { cn } from 'ui'

interface DotPingProps {
  animate?: boolean
  variant?: 'primary' | 'default' | 'warning'
}

export const DotPing = ({ animate = true, variant = 'primary' }: DotPingProps) => {
  return (
    <div className="relative align-middle w-2.5 h-2.5">
      <span
        className={cn(
          'absolute inset-0 rounded-full',
          animate && 'animate-ping',
          variant === 'primary' && 'bg-brand/20',
          variant === 'default' && 'bg-selection/20',
          variant === 'warning' && 'bg-warning/20'
        )}
        style={{
          animationDelay: '1s',
          animationDuration: '1.5s',
        }}
      />
      <span
        className={cn(
          'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-block w-2 h-2 rounded-full',
          variant === 'primary' && 'bg-brand',
          variant === 'default' && 'bg-selection',
          variant === 'warning' && 'bg-warning'
        )}
      />
    </div>
  )
}
